import { JObject, PRecord } from '@zwa73/utils';
import * as PIXI from 'pixi.js';





export class PixiObject<
    T extends PixiObject<T,C>,
    C extends PixiObject<any,any>
>{
    protected node:PIXI.Container;
    protected childTable:PRecord<string,C>={};
    constructor(node:PIXI.Container){
        this.node = node;
    }
    /**销毁子元素 */
    destoryChildren(){
        this.node.removeChildren().forEach(s=>s.destroy({
            children:true,
            context:true,
            style:true,
            texture:true
        }))
    }
    /**销毁自身 */
    destory(){
        this.node.destroy({
            children:true,
            context:true,
            style:true,
            texture:true
        });
    }
    /**获取Pixi节点 */
    getNode(){
        return this.node;
    }
    /**设置子元素 */
    setChild(key:string,child:C){
        const c = this.childTable[key];
        if(c==null) return;
        this.node.removeChild(c.getNode());
        c.destory();
        this.node.addChild(child.getNode());
        this.childTable[key] = child;

    }
    /**获取子元素 */
    getChild(key:string){
        return this.childTable[key];
    }
    /**获取子元素表 */
    getChildTable(){
        return this.childTable;
    }
}