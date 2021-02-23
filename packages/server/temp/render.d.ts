import type { Router } from '@ream/app/router';
import { ReamServerRequest, ReamServerResponse, ReamServerHandler } from './server';
import type { ServerEntry } from '.';
export declare type RenderError = {
    statusCode: number;
};
export declare type ServerRouteLoader = {
    type: 'server';
    load: () => Promise<{
        default: ReamServerHandler;
    }>;
};
export declare function render({ url, req, res, dotReamDir, ssrManifest, serverEntry, isPreloadRequest, scripts, styles, }: {
    url: string;
    req?: ReamServerRequest;
    res?: ReamServerResponse;
    dotReamDir: string;
    ssrManifest?: any;
    serverEntry: ServerEntry;
    isPreloadRequest?: boolean;
    scripts: string;
    styles: string;
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
export declare function getPreloadData(components: any[], options: {
    req?: ReamServerRequest;
    res?: ReamServerResponse;
    params: any;
}): Promise<{
    data: any;
    hasPreload?: boolean;
    notFound?: boolean;
    error?: {
        statusCode: number;
        stack?: string;
    };
}>;
