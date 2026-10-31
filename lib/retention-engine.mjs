export function scoreRetentionTask({days=0,noShow=false,amount=0}={}){
  const safeDays=Math.max(0,Number(days)||0);
  const safeAmount=Math.max(0,Number(amount)||0);
  let score=0;
  const reasons=[];

  if(noShow){
    score+=45;
    reasons.push("no_show");
  }

  if(safeDays>=60){
    score+=45;
    reasons.push("lapsed_60d");
  }else if(safeDays>=45){
    score+=35;
    reasons.push("lapsed_45d");
  }else if(safeDays>=30){
    score+=20;
    reasons.push("lapsed_30d");
  }

  if(safeAmount>=1_000_000){
    score+=20;
    reasons.push("high_value");
  }else if(safeAmount>=500_000){
    score+=12;
    reasons.push("mid_value");
  }else if(safeAmount>0){
    score+=6;
    reasons.push("value_signal");
  }

  const bounded=Math.min(100,score);
  const priority=bounded>=60?"HIGH":bounded>=35?"MEDIUM":"LOW";
  return {score:bounded,priority,reasons};
}

export function rankRetentionTasks(tasks=[]){
  return [...(Array.isArray(tasks)?tasks:[])]
    .map((task,index)=>({...task,retention:scoreRetentionTask(task),_index:index}))
    .sort((a,b)=>b.retention.score-a.retention.score||a._index-b._index)
    .map(({_index,...task})=>task);
}
