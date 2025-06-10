import { forwardRef, Ref, useImperativeHandle, useState } from "react";
import styled, { css, RuleSet } from "styled-components";
import { DynStyleable, parseDynStyle } from "../Styles";
import { Button, Card } from "@zwa73/react-utils";





interface InputDialogProps {
    desc?:string;
    initialText?: string;
    onClick?: () => void;
    overlayStyle?:RuleSet;
    inputStyle?:RuleSet;
    buttonStyle?:RuleSet;
    descStyle?:RuleSet;
}

export type InputCard = {
    getText: () => string;
    setText: (text: string) => void;
}

const OverlayStyle = css`
    z-index: 1000;
    text-align: center;
    display: flex; /* 使用 flexbox 布局 */
    align-items: center; /* 垂直居中 */
    justify-content: space-between; /* 水平居中 */
    border: 1px solid black;
    padding: 1px;
    white-space: nowrap; /* 防止换行 */
    &&:hover{
        border: 1px solid black;
    }
    && > *{
        margin: 1px;
        padding: 1px;
    }
`;
const Input = styled.input<DynStyleable>`
    padding: 0px 0px;
    margin: 0px 0px;
    width: 60%;
    height: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    border-width: 1px;
    box-sizing: border-box; /* 确保 padding 和 border 包含在总尺寸内 */
    background-color: transparent;
    ${parseDynStyle}
`;
const ButtonStyle = css`
    border: 1px solid #000000;
    width: 20%;
    font-size: 0.8rem;
    height: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    &&:hover{
        border: 1px solid #000000;
    }
`;
const TextStyle = css`
    font-size: 0.8rem;
    width: 20%;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const InputCard = forwardRef((props: InputDialogProps, ref: Ref<InputCard>)=>{

    const {descStyle,desc,buttonStyle,initialText,inputStyle,onClick,overlayStyle} = props;

    const [text, setText] = useState(initialText ?? '');

    useImperativeHandle(ref, () => ({
        getText: () => text,
        setText: (newText: string) => setText(newText),
    }));

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setText(event.target.value);
    };

    return (
        <Card cardStyle={OverlayStyle.concat(overlayStyle)}>
            <Card
                cardStyle={TextStyle.concat(descStyle)}
                tooltip="游戏路径"
            >{desc}</Card>
            <Input
                $dynstyle={inputStyle}
                type="text"
                value={text}
                onChange={handleChange}
                placeholder="Enter some text"
            />
            <Button
                onClick={onClick}
                cardStyle={ButtonStyle.concat(buttonStyle)}
                content="Submits"
            />
        </Card>
    );
});