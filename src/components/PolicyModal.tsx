import React from 'react';
import {policies} from '../shared/content';
export default function PolicyModal({isOpen,onClose,initialTab}:{isOpen:boolean;onClose:()=>void;initialTab:string}){
 const p=policies[initialTab]||policies.terms;
 return isOpen?<div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-6" role="dialog" aria-modal="true" aria-label={p.title}><div className="max-w-3xl mx-auto bg-white p-8 space-y-5"><button onClick={onClose} className="float-right">Close</button><h2 className="text-2xl">{p.title}</h2>{p.paragraphs.map(text=><p key={text}>{text}</p>)}<a href={`/policies/${initialTab}`}>Open full page</a></div></div>:null;
}
