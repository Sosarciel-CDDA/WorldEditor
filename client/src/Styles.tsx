import { RuleSet } from "styled-components";




/**可动态传入的样式的组件 */
export interface DynStyleable {
    /**动态传入的样式 仅供styled-components使用的$瞬态属性 */
    $dynstyle?: RuleSet;
}
/**解析动态样式的函数 */
export const parseDynStyle = (props:DynStyleable)=> props.$dynstyle;


