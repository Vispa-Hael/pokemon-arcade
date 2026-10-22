const puzzles=[
 {title:'The back-rank breakthrough',fen:'6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',hint:'Your Blastoise rook can attack along the eighth rank.'},
 {title:'A queen and a friend',fen:'7k/8/5KQ1/8/8/8/8/8 w - - 0 1',hint:'Place Mew next to the enemy king, protected by Mewtwo.'},
 {title:'The ladder finish',fen:'7k/R7/8/8/8/8/8/1R4K1 w - - 0 1',hint:'One rook blocks the seventh rank. Let the other take the eighth.'},
 {title:'The scholar’s strike',fen:'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4',hint:'Mew and Venusaur are both looking at f7.'},
 {title:'Punish the opening',fen:'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2',hint:'You play black. Ninetales has an open diagonal toward h4.'},
 {title:'Nowhere to run',fen:'6rk/6pp/8/4N3/8/8/8/6K1 w - - 0 1',hint:'Charizard can jump to f7. The king’s own team blocks its escape.'}
,...puzzleBank
];
puzzles.slice(0,6).forEach((p,i)=>{p.difficulty=['easy','easy','easy','medium','easy','medium'][i];p.complexity=p.difficulty==='easy'?4:7});
function parsePosition(fen){const [board,turn,rights,ep,half]=fen.split(' ');const b=[];for(const c of board){if(c==='/')continue;if(/[1-8]/.test(c))b.push(...Array(Number(c)).fill('.'));else b.push(c)}return {b,turn,rights:rights==='-'?'':rights,ep:ep==='-'?-1:(8-Number(ep[1]))*8+'abcdefgh'.indexOf(ep[0]),half:Number(half)||0}}
let mode='computer',human='w',difficulty='medium',puzzleIndex=0,puzzleSolved=false,feedback='',thinking=false,worker=null,computerTimer=null,generation=0;
let puzzleTheme='all',puzzleLevel='all',puzzleCompletion='all',puzzleSide='all',puzzleSort='number',puzzleSearch='',pickerPage=0;
const pickerPageSize=100,difficultyOrder={easy:0,medium:1,hard:2};
const puzzleKey=p=>p.id||'starter-'+puzzles.indexOf(p);
let solvedPuzzles=new Set();
try{const saved=JSON.parse(localStorage.getItem('pokemon-chess-puzzles')||'{}');const valid=new Set(puzzles.map(puzzleKey));solvedPuzzles=new Set((Array.isArray(saved.solved)?saved.solved:[]).filter(id=>valid.has(id)));puzzleIndex=Math.max(0,Math.min(puzzles.length-1,Number(saved.current)||0))}catch{}
function savePuzzleProgress(){try{localStorage.setItem('pokemon-chess-puzzles',JSON.stringify({solved:[...solvedPuzzles],current:puzzleIndex}))}catch{}}
function visiblePuzzles(){
 const query=puzzleSearch.trim().toLowerCase();
 const list=puzzles.map((p,i)=>i).filter(i=>{const p=puzzles[i],solved=solvedPuzzles.has(puzzleKey(p));return (puzzleTheme==='all'||(p.theme||'Starter collection')===puzzleTheme)&&(puzzleLevel==='all'||p.difficulty===puzzleLevel)&&(puzzleCompletion==='all'||(puzzleCompletion==='solved'?solved:!solved))&&(puzzleSide==='all'||p.fen.split(' ')[1]===puzzleSide)&&(!query||((i+1)+' '+p.title+' '+(p.theme||'Starter collection')).toLowerCase().includes(query))});
 return list.sort((a,b)=>{if(puzzleSort==='easy-first'||puzzleSort==='hard-first'){const direction=puzzleSort==='hard-first'?-1:1;return direction*((difficultyOrder[puzzles[a].difficulty]-difficultyOrder[puzzles[b].difficulty])||(puzzles[a].complexity-puzzles[b].complexity))||a-b}if(puzzleSort==='unsolved-first')return Number(solvedPuzzles.has(puzzleKey(puzzles[a])))-Number(solvedPuzzles.has(puzzleKey(puzzles[b])))||a-b;return a-b});
}
function fillPuzzlePicker(alignCurrent=true){
 const picker=$('puzzle-picker'),list=visiblePuzzles(),at=list.indexOf(puzzleIndex),pages=Math.max(1,Math.ceil(list.length/pickerPageSize));
 if(alignCurrent&&at>=0)pickerPage=Math.floor(at/pickerPageSize);pickerPage=Math.max(0,Math.min(pages-1,pickerPage));
 picker.replaceChildren();const page=list.slice(pickerPage*pickerPageSize,(pickerPage+1)*pickerPageSize);
 if(!page.includes(puzzleIndex)){const o=document.createElement('option');o.value='';o.textContent=list.length?'Choose a puzzle on this page':'No matching puzzles';picker.append(o)}
 for(const i of page){const p=puzzles[i],o=document.createElement('option');o.value=i;o.textContent=(solvedPuzzles.has(puzzleKey(p))?'✓ ':'')+(i+1)+'. '+p.title+' · '+p.difficulty;picker.append(o)}
 picker.value=page.includes(puzzleIndex)?String(puzzleIndex):'';picker.disabled=!list.length;
 $('puzzle-results').textContent=list.length.toLocaleString()+' matching · page '+(pickerPage+1)+' / '+pages;
 $('puzzle-page-back').disabled=pickerPage===0;$('puzzle-page-next').disabled=pickerPage>=pages-1;
 $('next-puzzle').disabled=!list.length;$('previous-puzzle').disabled=!list.length;$('shuffle-puzzle').disabled=list.filter(i=>i!==puzzleIndex).length===0;
}
function stepPuzzle(delta){const list=visiblePuzzles();if(!list.length)return;const at=list.indexOf(puzzleIndex);puzzleIndex=list[at<0?(delta<0?list.length-1:0):(at+delta+list.length)%list.length];startMode()}
function applyPuzzleFilters(){const list=visiblePuzzles();pickerPage=0;if(list.length&&!list.includes(puzzleIndex)&&mode==='puzzles'){puzzleIndex=list[0];startMode()}else{fillPuzzlePicker();updateModePanel()}}
const savedReset=reset,savedPlay=play,savedRender=render;
function cancelComputer(){generation++;clearTimeout(computerTimer);computerTimer=null;worker?.terminate();worker=null;thinking=false;}
window.canHumanMove=()=>!thinking&&(mode!=='computer'||state.turn===human)&&!(mode==='puzzles'&&puzzleSolved);
function startMode(){cancelComputer();feedback='';selected=null;choices=[];puzzleSolved=false;flipped=mode==='computer'?human==='b':mode==='puzzles'?parsePosition(puzzles[puzzleIndex].fen).turn==='b':false;if(mode==='puzzles'){savePuzzleProgress();fillPuzzlePicker();state=parsePosition(puzzles[puzzleIndex].fen);snapshots=[];notation=[];render()}else savedReset();}
function queueComputer(){
 if(mode!=='computer'||state.turn===human||result()||thinking)return;
 thinking=true;const id=generation;updateModePanel();
 computerTimer=setTimeout(()=>{
  if(id!==generation)return;
  try{
   const url=URL.createObjectURL(new Blob([window.CHESS_WORKER_SOURCE],{type:'text/javascript'}));
   worker=new Worker(url);URL.revokeObjectURL(url);
   const fail=()=>{if(id!==generation)return;cancelComputer();feedback='Computer could not start. Press Retry computer.';updateModePanel()};
   worker.onerror=fail;
   worker.onmessage=async event=>{if(id!==generation)return;const response=event.data;if(response.error||!response.move){fail();return}worker.terminate();worker=null;thinking=false;await play(response.move,{computer:true,promotion:'q'});};
   worker.postMessage({id,state:structuredClone(state),level:difficulty});
  }catch{cancelComputer();feedback='Computer could not start. Press Retry computer.';updateModePanel()}
 },1250);
}
play=async function(m,options={}){
 if(mode==='computer'&&!options.computer&&!window.canHumanMove())return;
 if(mode==='puzzles'){
  if(puzzleSolved)return;const next=apply(state,m);if(!checked(next,next.turn)||all(next).length){feedback='That is legal, but it is not checkmate. Try another move.';selected=null;choices=[];render();return}
  puzzleSolved=true;solvedPuzzles.add(puzzleKey(puzzles[puzzleIndex]));savePuzzleProgress();fillPuzzlePicker();feedback='Solved! Checkmate. Choose Next puzzle for another challenge.';
 }
 await savedPlay(m,options);
};
render=function(){savedRender();updateModePanel();queueComputer()};
function updateModePanel(){
 $('computer-settings').hidden=mode!=='computer';$('puzzle-settings').hidden=mode!=='puzzles';$('retry-computer').hidden=mode!=='computer'||!feedback.startsWith('Computer could');
 $('mode-description').textContent=mode==='computer'?`You play ${human==='w'?'Team Pikachu (white)':'Team Eevee (black)'}. Computer: ${difficulty}.`:mode==='puzzles'?'Find checkmate in one move. Any mating move counts.':'Two trainers share the board.';
 $('puzzle-title').textContent=`${puzzleIndex+1}/${puzzles.length} · ${puzzles[puzzleIndex].title} · ${puzzles[puzzleIndex].difficulty}`;
 $('next-puzzle').textContent='Next puzzle';$('puzzle-progress').textContent=solvedPuzzles.size+' / '+puzzles.length+' solved · saved on this device';
 if(feedback)$('hint').textContent=feedback;
 else if(thinking)$('hint').textContent='The computer is thinking…';
 else if(mode==='puzzles')$('hint').textContent=`${state.turn==='w'?'White':'Black'} to move. Find checkmate in one.`;
 if(mode==='puzzles')$('status').textContent=puzzleSolved?'Puzzle solved!':'Mate in one';
 document.querySelector('.badge').textContent=mode==='computer'?'TRAINER VS. COMPUTER':mode==='puzzles'?'PUZZLE TRAINING':'TRAINER VS. TRAINER';
}
$('game-mode').onchange=e=>{mode=e.target.value;startMode()};
$('human-side').onchange=e=>{human=e.target.value;startMode()};
$('computer-level').onchange=e=>{difficulty=e.target.value;cancelComputer();feedback='';render()};
$('restart').onclick=startMode;
$('undo').onclick=()=>{cancelComputer();feedback='';puzzleSolved=false;if(snapshots.length){state=snapshots.pop();notation.pop();if(mode==='computer'&&state.turn!==human&&snapshots.length){state=snapshots.pop();notation.pop()}selected=null;choices=[];}render()};
$('puzzle-hint').onclick=()=>{feedback=puzzles[puzzleIndex].hint;updateModePanel()};
$('next-puzzle').onclick=()=>stepPuzzle(1);
$('previous-puzzle').onclick=()=>stepPuzzle(-1);
$('shuffle-puzzle').onclick=()=>{const list=visiblePuzzles().filter(i=>i!==puzzleIndex);const unsolved=list.filter(i=>!solvedPuzzles.has(puzzleKey(puzzles[i])));const pool=unsolved.length?unsolved:list;if(pool.length){puzzleIndex=pool[Math.floor(Math.random()*pool.length)];startMode()}};
$('puzzle-picker').onchange=e=>{if(e.target.value==='')return;const i=Number(e.target.value);if(Number.isInteger(i)&&visiblePuzzles().includes(i)){puzzleIndex=i;startMode()}};
$('puzzle-filter').onchange=e=>{puzzleTheme=e.target.value;applyPuzzleFilters()};
$('puzzle-difficulty').onchange=e=>{puzzleLevel=e.target.value;applyPuzzleFilters()};
$('puzzle-completion').onchange=e=>{puzzleCompletion=e.target.value;applyPuzzleFilters()};
$('puzzle-side').onchange=e=>{puzzleSide=e.target.value;applyPuzzleFilters()};
$('puzzle-sort').onchange=e=>{puzzleSort=e.target.value;applyPuzzleFilters()};
$('puzzle-search').oninput=e=>{puzzleSearch=e.target.value;applyPuzzleFilters()};
$('puzzle-page-back').onclick=()=>{pickerPage--;fillPuzzlePicker(false)};
$('puzzle-page-next').onclick=()=>{pickerPage++;fillPuzzlePicker(false)};
$('puzzle-clear-filters').onclick=()=>{puzzleTheme=puzzleLevel=puzzleCompletion=puzzleSide='all';puzzleSort='number';puzzleSearch='';for(const id of ['puzzle-filter','puzzle-difficulty','puzzle-completion','puzzle-side'])$(id).value='all';$('puzzle-sort').value='number';$('puzzle-search').value='';applyPuzzleFilters()};
$('retry-puzzle').onclick=startMode;
$('retry-computer').onclick=()=>{feedback='';render()};
for(const theme of ['all',...new Set(puzzles.map(p=>p.theme||'Starter collection'))]){const o=document.createElement('option');o.value=theme;o.textContent=theme==='all'?'All puzzle themes':theme;$('puzzle-filter').append(o)}
fillPuzzlePicker();
startMode();

