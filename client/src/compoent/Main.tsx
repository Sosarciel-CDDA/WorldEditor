import { FC, useContext, useRef, useState } from "react";
import { InputCard } from "./InputCard";
import { BridgeHelper } from "BridgeHelper";
import { GlobalContext } from "./GlobalContext";
import { ToolPanel } from "./ToolPanel";
import { MainPanel } from "./MainPanel";
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
    const { setTilesetData,setGameDataTable,setI18NData } = useContext(GlobalContext);
    const [inited,setInited] = useState(false);
    const inputDialogRef = useRef<InputCard>(null);
    const [inputVisible, setInputVisible] = useState(true);
    const [userInput, setUserInput] = useState('');

    const handleInputSubmit = () => {
        (async ()=>{
            if (inputDialogRef.current) {
                //const text = inputDialogRef.current.getText();
                const text = "H:/CDDA/cdda-windows-tiles-x64-2023-05-08-0608/";
                setUserInput(text);
                setInputVisible(false);

                console.time('client init');
                const [tilesetData,gameData,i18n] = await Promise.all([
                    BridgeHelper.loadTileset(text,'MSX++UnDeadPeopleEdition'),
                    BridgeHelper.loadGameData(text),
                    BridgeHelper.loadI18NData(text,'zh_CN'),
                ]);
                setTilesetData(tilesetData);
                setGameDataTable(gameData);
                setI18NData(i18n);
                remapOMTerrainID(gameData.Mapgen);
                console.timeEnd('client init');
                setInited(true);
            }
        })();
    };

    //#region 重设事件
    const panelRef = useRef<MainPanel>(null);
    //#endregion
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
            <MainPanel ref={panelRef}/>
            <ToolPanel/>
        </body>
    );
}