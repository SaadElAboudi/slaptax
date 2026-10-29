function json(res, code, payload) {
    res.writeHead(code, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-SlapTax-Client, X-SlapTax-User",
    });
    res.end(JSON.stringify(payload));
}

function parseBody(req) {
    if(req.parsedBody!==undefined)return Promise.resolve(req.parsedBody);
    return new Promise((resolve, reject) => {
        let body = "",size=0,tooLarge=false;
        const invalid=(message,statusCode)=>Object.assign(new Error(message),{statusCode});
        req.on("data", (chunk) => {
            size+=Buffer.byteLength(chunk);if(size>1e6){tooLarge=true;reject(invalid("Payload too large",413));return;}
            if(!tooLarge)body += chunk;
        });
        req.on("end", () => {
            if(tooLarge)return;
            if (!body) {
                req.parsedBody={};resolve(req.parsedBody);
                return;
            }
            try {
                const parsed=JSON.parse(body);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Object required');req.parsedBody=parsed;resolve(req.parsedBody);
            } catch (err) {
                reject(invalid("Invalid JSON object body",400));
            }
        });
        req.on("error", reject);
    });
}

module.exports = {
    json,
    parseBody,
};
