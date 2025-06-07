import { BrushProps } from "./BrushInterface";
import { Pencil } from "./Pencil";




export type BrushType = 'pencil';
export const BrushSharedData:{
    brushMode:BrushType;
    brushSlot?:string;
}={
    brushMode:'pencil',
};
export function BrushRoute(props:BrushProps){
    switch(BrushSharedData.brushMode){
        case 'pencil':
            return Pencil(props);
    }
}

