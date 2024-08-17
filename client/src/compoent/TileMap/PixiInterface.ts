import { JObject, PRecord } from '@zwa73/utils';
import * as PIXI from 'pixi.js';



/**PIXI终端元素 */
export class PixiUnit<T extends PixiUnit<T,D>, D>{
    constructor(protected dataTable:D,protected node:PIXI.Container){}
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
    getDataTable(){
        return this.dataTable;
    }
}
/**PIXI容器元素 */
export class PixiNode<
    T extends PixiNode<T,C,D>,
    C extends PixiUnit<any,any>,
    D extends PRecord<string,ReturnType<C['getDataTable']>>
> extends PixiUnit<PixiNode<T,C,D>,D>{
    protected childrenTable:PRecord<string,C>={};
    constructor(dataTable:D,node:PIXI.Container){
        super(dataTable,node);
        this.dataTable=dataTable;
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
    /**设置子元素 */
    setChild(key:keyof D&string,child:C){
        const c = this.childrenTable[key];
        if(c!=null){
            this.node.removeChild(c.getNode());
            c.destory();
        }
        this.node.addChild(child.getNode());
        this.childrenTable[key] = child;
        if(typeof this.dataTable === 'object')
            (this.dataTable as any)[key] = child.getDataTable();

    }
    /**获取子元素 */
    getChild(key:string){
        return this.childrenTable[key];
    }
}
