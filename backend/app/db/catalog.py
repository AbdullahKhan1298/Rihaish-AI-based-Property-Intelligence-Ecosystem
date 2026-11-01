"""SQL catalog across logical city partitions, with the same query on both backends."""
import sqlite3
from .database import distributed_enabled, SHARD_PATHS
from .rqlite import CITIES, Connection


def open_catalog(cities):
    if not set(cities).issubset(CITIES):
        raise ValueError('Unknown city')
    distributed = distributed_enabled()
    conn = Connection() if distributed else sqlite3.connect(':memory:', uri=True)
    if not distributed:
        conn.row_factory = sqlite3.Row
    selects = []
    for city in cities:
        if not distributed:
            # Live primary reads avoid the legacy stale manual file-copy replicas.
            conn.execute(f'ATTACH DATABASE ? AS {city}', (SHARD_PATHS[city]['primary'].resolve().as_uri() + '?mode=ro',))
        prefix = city + ('_' if distributed else '.')
        selects.append(f"SELECT p.*, '{city}' AS _city, EXISTS(SELECT 1 FROM {prefix}government_records g WHERE g.property_id=p.id AND g.is_verified=1) AS _verified FROM {prefix}properties p")
    return conn, 'WITH catalog AS (' + ' UNION ALL '.join(selects) + ') '


def search_catalog(cities, society=None, property_type=None, max_price=None, min_price=None,
                   min_ai_score=None, verified_only=False, q=None, sort='score_desc', page=1, page_size=None):
    orders = {'score_desc': 'ai_investment_score DESC', 'price_asc': 'price ASC', 'price_desc': 'price DESC', 'newest': 'created_at DESC'}
    if sort not in orders:
        raise ValueError('Unknown sort order')
    conn, cte = open_catalog(cities)
    predicates, parameters = [], []
    for column, operator, value in [('society_id', '=', society if society and society.lower() != 'all' else None),
                                    ('type', '=', property_type if property_type and property_type.lower() != 'all' else None),
                                    ('price', '<=', max_price), ('price', '>=', min_price),
                                    ('ai_investment_score', '>=', min_ai_score)]:
        if value is not None:
            predicates.append(f'{column} {operator} ?')
            parameters.append(value)
    if verified_only:
        predicates.append('_verified = 1')
    if q:
        # Treat wildcards literally; all user input is bound as data.
        term = '%' + q.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_') + '%'
        predicates.append("(title LIKE ? ESCAPE '\\' OR society_name LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')")
        parameters.extend([term] * 3)
    where = (' WHERE ' + ' AND '.join(predicates)) if predicates else ''
    try:
        total = conn.execute(cte + 'SELECT COUNT(*) AS count FROM catalog' + where, parameters).fetchone()['count']
        sql = cte + 'SELECT * FROM catalog' + where + ' ORDER BY ' + orders[sort] + ', id ASC, _city ASC'
        if page_size is not None:
            sql += ' LIMIT ? OFFSET ?'
            parameters = [*parameters, page_size, (page - 1) * page_size]
        rows = conn.execute(sql, parameters).fetchall()
        return total, [dict(row) for row in rows]
    finally:
        conn.close()
