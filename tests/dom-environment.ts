import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>',{url:'http://localhost/'});
for(const key of ['window','document','location','navigator','HTMLElement','HTMLInputElement','HTMLTextAreaElement','Node','NodeFilter','Element','Document','DocumentFragment','MutationObserver','Event','MouseEvent','KeyboardEvent','CustomEvent','SVGElement','FocusEvent','HTMLButtonElement','AbortController','AbortSignal']){
 Object.defineProperty(globalThis,key,{value:(dom.window as unknown as Record<string,unknown>)[key],configurable:true,writable:true});
}
Object.assign(globalThis,{getComputedStyle:dom.window.getComputedStyle.bind(dom.window),requestAnimationFrame:(fn:FrameRequestCallback)=>setTimeout(()=>fn(performance.now()),0),cancelAnimationFrame:(id:ReturnType<typeof setTimeout>)=>clearTimeout(id),IS_REACT_ACT_ENVIRONMENT:true,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
dom.window.HTMLElement.prototype.scrollIntoView=function(){};
export {dom};
