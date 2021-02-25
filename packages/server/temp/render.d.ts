import type { Router } from 'vue-router';
import { ReamServerRequest, ReamServerResponse, ReamServerHandler } from './server';
import type { ExportInfo, ServerEntry } from '.';
export declare type RenderError = {
    statusCode: number;
};
export declare type ServerRouteLoader = {
    type: 'server';
    load: () => Promise<{
        default: ReamServerHandler;
    }>;
};
export declare function render({ url, req, res, dotReamDir, ssrManifest, serverEntry, isPreloadRequest, scripts, styles, exportInfo, }: {
    url: string;
    req?: ReamServerRequest;
    res?: ReamServerResponse;
    dotReamDir: string;
    ssrManifest?: any;
    serverEntry: ServerEntry;
    isPreloadRequest?: boolean;
    scripts: string;
    styles: string;
    exportInfo?: ExportInfo;
}): Promise<{
    statusCode: number;
    body: string;
    headers: {
        [k: string]: string;
    };
    cacheFiles: Map<string, string>;
}>;
export declare function renderToHTML(options: {
    params: any;
    url: string;
    path: string;
    req?: any;
    res?: any;
    preloadResult: {
        [k: string]: any;
    };
    router: Router;
    serverEntry: ServerEntry;
    ssrManifest: any;
    scripts: string;
    styles: string;
}): Promise<string>;
declare type PreloadResult = {
    data: any;
    hasPreload?: boolean;
    isStatic?: boolean;
    notFound?: boolean;
    error?: {
        statusCode: number;
        stack?: string;
    };
};
export declare function getPreloadData(components: any[], options: {
    req?: ReamServerRequest;
    res?: ReamServerResponse;
    params: any;
}): Promise<PreloadResult>;
export {};
