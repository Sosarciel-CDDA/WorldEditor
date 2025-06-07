import { createRoot } from 'react-dom/client';
import { Main } from './compoent/Main';
import { GlobalProvider } from './compoent/GlobalContext';
import { UtilRT } from '@zwa73/react-utils';

UtilRT.setStyleVar(document.documentElement,{
    "--background-color-1": "rgb(245, 245, 245)",  // 亮色背景1
    "--background-color-2": "rgb(230, 230, 230)",  // 亮色背景2
    "--background-color-3": "rgb(210, 210, 210)",  // 亮色背景3
    "--background-color-1-trans": "rgba(245, 245, 245, 0.5)",  // 亮色背景1透明
    "--font-color-1": "rgb(50, 50, 50)",           // 深色字体1
    "--font-color-2": "rgb(0, 122, 204)",          // 深色字体2
});

const root = createRoot(document.body);
root.render(
<GlobalProvider>
<Main/>
</GlobalProvider>
);
//    <Image src={`F:/Sosarciel/CDDA/WorldEditor/data/normal_fields.png`} alt="Tileset Image" />
