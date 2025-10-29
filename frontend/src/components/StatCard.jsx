import React from 'react';
export default function StatCard({title, value, sub}) {
  return (
    <div className="card">
      <div className="small">{title}</div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:28,fontWeight:700}}>{value}</div>
        <div className="small">{sub}</div>
      </div>
    </div>
  );
}
