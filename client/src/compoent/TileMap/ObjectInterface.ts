import { JObject, PRecord } from '@zwa73/utils';
import * as PIXI from 'pixi.js';





export class PixiObject<
    T extends PixiObject<T,C,D>,
    C extends PixiObject<any,any,any>,
    D extends PRecord<string,ReturnType<C['getData']>>
>{
    protected node:PIXI.Container;
    protected childrenTable:PRecord<string,C>={};
    protected dataTable:D;
    constructor(dataTable:D,node:PIXI.Container){
        this.dataTable=dataTable;
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
    /**获取数据 */
    getData(){
        return this.dataTable;
    }
    /**设置子元素 */
    setChildren(key:string,child:C){
        const c = this.childrenTable[key];
        if(c==null) return;
        this.node.removeChild(c.getNode());
        c.destory();
        this.node.addChild(child.getNode());
        this.childrenTable[key] = child;
        (this.dataTable as any)[key] = child.getData();

    }
    /**获取子元素 */
    getChildren(key:string){
        return this.childrenTable[key];
    }
}