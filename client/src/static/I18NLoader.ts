import { IpcMainInvokeEvent } from 'electron';
import gettextParser  from 'gettext-parser';
import path from 'pathe';
import fs from 'fs';
import { PRecord } from '@zwa73/utils';



export type LangFlag =
    | "ar"
    | "cs"
    | "da"
    | "de"
    | "el"
    | "es_AR"
    | "es_ES"
    | "fil_PH"
    | "fr"
    | "ga_IE"
    | "hu"
    | "id"
    | "is"
    | "it_IT"
    | "ja"
    | "ko"
    | "nb"
    | "nl"
    | "pl"
    | "pt_BR"
    | "ro"
    | "ru"
    | "sr"
    | "tr"
    | "uk_UA"
    | "zh_CN"
    | "zh_TW";

export async function loadI18NData(e:IpcMainInvokeEvent|undefined,gamePath:string,langFlag:LangFlag){
    console.time('static loadI18NData');
    const langPatj = path.join(gamePath,'lang','mo',langFlag,'LC_MESSAGES','cataclysm-dda.mo');
    const dat = await fs.promises.readFile(langPatj);
    const table = gettextParser.mo.parse(dat);
    const out:PRecord<string,string>={};

    for (const k in table.translations) {
        const innerValues = table.translations[k];
        for (const ik in innerValues) {
            const v = innerValues[ik];
            out[v.msgid] = v.msgstr[0];
        }
    }
    console.timeEnd('static loadI18NData');
    return out;
}

if(false)(async()=>{
    console.time('load4');
    const d = await loadI18NData(undefined,
        'H:/CDDA/cdda-windows-tiles-x64-2023-05-08-0608/',
        'zh_CN'
    );
    console.log(d['rock']);
    console.timeEnd('load4');
    console.log(123)
})();

if(false)(async ()=>{
    const langPatj = path.join('H:/CDDA/cdda-windows-tiles-x64-2023-05-08-0608/','lang','mo');
    const list = await fs.promises.readdir(langPatj);
    console.log(list.join(`"|"`));
})();
