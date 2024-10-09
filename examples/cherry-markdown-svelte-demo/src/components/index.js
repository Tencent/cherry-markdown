import { writable } from 'svelte/store';

const groupIdx = writable(0);
const apiIdx = writable(0);

function handleClick(group,api){
    event.preventDefault();
    groupIdx.set(group);
    apiIdx.set(api);
}

export { groupIdx, apiIdx, handleClick };
