import React, { createContext, useContext, useState } from 'react';

const ShardContext = createContext();

export function ShardProvider({ children }) {
  const [shards, setShards] = useState([
    {
      id: 'shard-khi',
      city: 'Karachi Region',
      cityKey: 'karachi',
      primaryNode: 'node-khi-primary-01 (Active)',
      primaryStatus: 'ONLINE',
      replicaNodes: ['replica-khi-01 (In-Sync)', 'replica-khi-02 (In-Sync)'],
      queryLatencyMs: 14,
      totalListings: 12450,
      replicationLagMs: 2,
    },
    {
      id: 'shard-lhr',
      city: 'Lahore Region',
      cityKey: 'lahore',
      primaryNode: 'node-lhr-primary-01 (Active)',
      primaryStatus: 'ONLINE',
      replicaNodes: ['replica-lhr-01 (In-Sync)'],
      queryLatencyMs: 12,
      totalListings: 9800,
      replicationLagMs: 1,
    },
    {
      id: 'shard-isb',
      city: 'Islamabad / Rawalpindi Region',
      cityKey: 'islamabad',
      primaryNode: 'node-isb-primary-01 (Active)',
      primaryStatus: 'ONLINE',
      replicaNodes: ['replica-isb-01 (In-Sync)'],
      queryLatencyMs: 9,
      totalListings: 8320,
      replicationLagMs: 1,
    }
  ]);

  const [activeFailovers, setActiveFailovers] = useState({});

  const simulateFailover = (shardId) => {
    setShards(prevShards =>
      prevShards.map(shard => {
        if (shard.id === shardId) {
          const isFailing = shard.primaryStatus === 'ONLINE';
          if (isFailing) {
            return {
              ...shard,
              primaryStatus: 'FAILOVER TRIGGERED -> PROMOTING REPLICA-01',
              primaryNode: 'replica-' + shard.cityKey.substring(0, 3) + '-01 (Promoted to Primary)',
              queryLatencyMs: 28,
              replicationLagMs: 0
            };
          } else {
            return {
              ...shard,
              primaryStatus: 'ONLINE',
              primaryNode: 'node-' + shard.cityKey.substring(0, 3) + '-primary-01 (Active)',
              queryLatencyMs: 12,
              replicationLagMs: 1
            };
          }
        }
        return shard;
      })
    );

    setActiveFailovers(prev => ({
      ...prev,
      [shardId]: !prev[shardId]
    }));
  };

  return (
    <ShardContext.Provider value={{ shards, simulateFailover, activeFailovers }}>
      {children}
    </ShardContext.Provider>
  );
}

export function useShards() {
  const context = useContext(ShardContext);
  if (!context) throw new Error('useShards must be used within ShardProvider');
  return context;
}
