// @vitest-environment jsdom
import {it,expect,vi} from 'vitest';
import {playSequence} from '../src/games/pocket-capsule-monsters/cinematics';
it('locks battle controls, supports Escape, restores focus and cancels timers',()=>{
 vi.useFakeTimers();const root=document.createElement('div');root.innerHTML='<div><button id="command">Command</button></div>';document.body.append(root);const command=root.querySelector<HTMLButtonElement>('button')!;command.focus();const done=vi.fn(),sync=vi.fn();
 const cancel=playSequence(root,[{title:'Arena',subtitle:'Prepare'},{title:'Deploy',subtitle:'Ready'}],false,sync,done);
 expect((root.firstElementChild as HTMLElement).inert).toBe(true);root.querySelector('.pcm-cinema')!.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));expect(done).toHaveBeenCalledOnce();expect(root.querySelector('.pcm-cinema')).toBeNull();expect(document.activeElement).toBe(command);cancel();vi.runAllTimers();expect(done).toHaveBeenCalledOnce();
 const stop=playSequence(root,[{title:'Arena',subtitle:'Prepare'}],false,sync,done);stop();vi.runAllTimers();expect(done).toHaveBeenCalledOnce();root.remove();vi.useRealTimers();
});
