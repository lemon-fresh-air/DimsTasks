let tasks=[];
async function refresh(){tasks=(await taskDb.all()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));renderTasks(tasks)}
async function addTask(){const title=els.input.value.trim();if(!title){els.input.focus();return}await taskDb.put({id:crypto.randomUUID(),title,dueDate:els.date.value||null,done:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});els.dialog.close();await refresh();toast("Задачу додано")}
els.add.addEventListener("click",openComposer);
els.date.addEventListener("change",()=>{els.dateLabel.textContent=readableDate(els.date.value)});
els.input.addEventListener("input",()=>{els.input.style.height="auto";els.input.style.height=`${Math.min(els.input.scrollHeight,150)}px`});
els.input.addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();addTask()}if(event.key==="Escape")els.dialog.close()});
els.form.addEventListener("submit",event=>{event.preventDefault();addTask()});
els.dialog.addEventListener("click",event=>{const box=els.dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)els.dialog.close()});
els.list.addEventListener("click",async event=>{const toggle=event.target.closest(".toggle");if(!toggle)return;const row=toggle.closest(".task-card");const task=tasks.find(item=>item.id===row.dataset.id);await taskDb.put({...task,done:true,updatedAt:new Date().toISOString()});await refresh();toast("Виконано")});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
refresh().catch(()=>toast("Не вдалося відкрити локальне сховище"));

