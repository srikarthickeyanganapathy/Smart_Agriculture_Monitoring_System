import React, {useEffect, useState} from 'react';
export default function Clock(){
  const [t,setT] = useState(new Date());
  useEffect(()=> {
    const id = setInterval(()=> setT(new Date()),1000);
    return ()=> clearInterval(id);
  },[]);
  return (<div className="card">
    <div className="small">TIME</div>
    <div className="clock">{t.toLocaleTimeString()}</div>
    <div className="small">{t.toLocaleDateString()}</div>
  </div>);
}
