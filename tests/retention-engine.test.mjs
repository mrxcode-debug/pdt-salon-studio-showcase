import assert from "node:assert/strict";
import {rankRetentionTasks,scoreRetentionTask} from "../lib/retention-engine.mjs";

assert.deepEqual(scoreRetentionTask({days:50}),{
  score:35,
  priority:"MEDIUM",
  reasons:["lapsed_45d"]
});

const noShowHigh=scoreRetentionTask({noShow:true,amount:1_280_000});
assert.equal(noShowHigh.score,65);
assert.equal(noShowHigh.priority,"HIGH");
assert.deepEqual(noShowHigh.reasons,["no_show","high_value"]);

assert.equal(scoreRetentionTask({days:-5,amount:-1}).score,0);
assert.equal(scoreRetentionTask({days:100,noShow:true,amount:2_000_000}).score,100);

const ranked=rankRetentionTasks([
  {id:"a",days:43},
  {id:"b",noShow:true,amount:890000},
  {id:"c",days:60}
]);
assert.deepEqual(ranked.map(x=>x.id),["b","c","a"]);
assert.deepEqual(ranked.map(x=>x.retention.priority),["MEDIUM","MEDIUM","LOW"]);

console.log("retention engine tests passed");
