import { Params } from 'nestjs-pino';
import { IncomingMessage } from 'http';

export const loggerConfig: Params = {
    pinoHttp: {
        transport:
            process.env.NODE_ENV === 'production'
                ? {
                    targets: [
                        {
                            target: 'pino-pretty', // Output to console (human-readable)
                            options: {
                                colorize: true,
                                singleLine: true,
                                levelFirst: true,
                                translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
                                destination: 1, // stdout
                            },
                        },
                    ],
                }
                : {
                    target: 'pino-pretty', // Dev: human-readable logs
                    options: {
                        colorize: true,
                        singleLine: true,
                        levelFirst: true,
                        translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
                    },
                },
        genReqId: (req: IncomingMessage) => {
            return req.headers['x-request-id'] || crypto.randomUUID();
        },
        // redact: {
        //     paths: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
        //     remove: true,
        // },
        customProps: (req: IncomingMessage) => ({
            context: 'HTTP',
        }),
        serializers: {
            err: (err) => ({
                type: err.type,
                message: err.message,
                stack: err.stack,
            }),
            res: (res) => ({
                statusCode: res.statusCode,
            }),
            req: (req) => {
                const url = req.url ?? '';
                const isAiChat = typeof url === 'string' && url.startsWith('/ai/chat/completions');

                return {
                    id: req.id,
                    method: req.method,
                    url,
                    query: req.query,
                    params: req.params,
                    body: isAiChat ? undefined : req.raw.body,
                    headers: {
                        ...req.headers,
                        authorization: undefined,
                    },
                };
            },
        },
    },
};
