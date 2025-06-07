import { FC, useCallback, useContext, useRef, useState } from "react";
import { InputCard } from "./InputCard";
import { BridgeProxy } from "BridgeHelper";
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
        void (async ()=>{
            if (!inputDialogRef.current) return;
            //const text = inputDialogRef.current.getText();
            //const text = "H:/CDDA/cdda-windows-tiles-x64-2023-05-08-0608/";
            const text = "H:/CDDA/newver11/cdda-windows-tiles-sounds-x64-2024-07-02-0131";
            setInputVisible(false);

            console.time('client init');
            const [tilesetData,gameData,i18n] = await Promise.all([
                BridgeProxy.loadTileset(text,'MSX++UnDeadPeopleEdition'),
                BridgeProxy.loadGameData(text),
                BridgeProxy.loadI18NData(text,'zh_CN'),
            ]);
            InitData.tilesetData = tilesetData;
            InitData.gameDataTable = gameData;
            InitData.i18NData = i18n;
            remapOMTerrainID(gameData.Mapgen);
            console.timeEnd('client init');
            setInited(true);
        })();
    },[]);
    console.log('rendering Main');

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
};