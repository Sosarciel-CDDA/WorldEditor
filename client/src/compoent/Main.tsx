import { FC, useCallback, useContext, useRef, useState } from "react";
import { InputCard } from "./InputCard";
import { BridgeHelper } from "BridgeHelper";
import { GlobalContext, InitData } from "./GlobalContext";
import { ToolPanel, ToolPanelDom } from "./ToolPanel";
import { CanvasPanelRef, CanvasPanelDom } from "./CanvasPanel";
import { css } from "styled-components";
import { remapOMTerrainID } from "./Util";



const inputCardStyle = css`
    transform: translate(-50%, -50%);
    position: fixed;
    top: 50%;
    left: 50%;
    width: 60%;
`;

export const Main:FC = ()=>{
    const inputDialogRef = useRef<InputCard>(null);
    const [inputVisible, setInputVisible] = useState(true);
    const {setInited} = useContext(GlobalContext);

    const handleInputSubmit = useCallback(() => {
        (async ()=>{
            if (!inputDialogRef.current) return;
            //const text = inputDialogRef.current.getText();
            const text = "H:/CDDA/cdda-windows-tiles-x64-2023-05-08-0608/";
            setInputVisible(false);

            console.time('client init');
            const [tilesetData,gameData,i18n] = await Promise.all([
                BridgeHelper.loadTileset(text,'MSX++UnDeadPeopleEdition'),
                BridgeHelper.loadGameData(text),
                BridgeHelper.loadI18NData(text,'zh_CN'),
            ]);
            InitData.tilesetData = tilesetData;
            InitData.gameDataTable = gameData;
            InitData.i18NData = i18n;
            remapOMTerrainID(gameData.Mapgen);
            console.timeEnd('client init');
            setInited(true);
        })();
    },[]);
    console.log('rendering Main')

    return (
        <body
            style={{overflow:'hidden'}}
        >
            {inputVisible && <InputCard
                desc="Game Path"
                overlayStyle={inputCardStyle}
                onClick={handleInputSubmit}
                initialText=''
                ref={inputDialogRef}
            />}
            {CanvasPanelDom}
            {ToolPanelDom}
        </body>
    );
}