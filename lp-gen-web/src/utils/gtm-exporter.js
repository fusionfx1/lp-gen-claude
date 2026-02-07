export function generateGtmJson(gtmId) {
    const accountId = "LP_FACTORY";
    const containerId = gtmId || "GTM-XXXXXXX";
    const timestamp = new Date().getTime();

    const json = {
        "exportFormatVersion": 2,
        "exportTime": new Date().toISOString(),
        "containerVersion": {
            "path": `accounts/${accountId}/containers/${containerId}/versions/0`,
            "accountId": accountId,
            "containerId": containerId,
            "containerVersionId": "0",
            "name": "LP Factory Auto-Config",
            "container": {
                "path": `accounts/${accountId}/containers/${containerId}`,
                "accountId": accountId,
                "containerId": containerId,
                "name": "LP Factory Container",
                "publicId": containerId,
                "usageContext": ["WEB"]
            },
            "tag": [
                {
                    "name": "GA4 - Config",
                    "type": "gaawc",
                    "parameter": [
                        { "type": "BOOLEAN", "key": "send_page_view", "value": "true" },
                        { "type": "TEMPLATE", "key": "measurement_id", "value": "{{GA4 Measurement ID}}" }
                    ],
                    "firingTriggerId": ["2147483647"],
                    "tagFiringOption": "ONCE_PER_EVENT"
                },
                {
                    "name": "GA4 - Event - CTA Click",
                    "type": "gaawe",
                    "parameter": [
                        { "type": "TEMPLATE", "key": "event_name", "value": "cta_click" },
                        { "type": "TEMPLATE", "key": "measurement_id", "value": "{{GA4 Measurement ID}}" }
                    ],
                    "firingTriggerId": ["1"],
                    "tagFiringOption": "ONCE_PER_EVENT"
                }
            ],
            "trigger": [
                {
                    "triggerId": "1",
                    "name": "Custom - cta_click",
                    "type": "CUSTOM_EVENT",
                    "customEventFilter": [
                        { "type": "EQUALS", "parameter": [{ "type": "TEMPLATE", "key": "arg0", "value": "{{_event}}" }, { "type": "TEMPLATE", "key": "arg1", "value": "cta_click" }] }
                    ]
                },
                {
                    "triggerId": "2",
                    "name": "Custom - slider_interact",
                    "type": "CUSTOM_EVENT",
                    "customEventFilter": [
                        { "type": "EQUALS", "parameter": [{ "type": "TEMPLATE", "key": "arg0", "value": "{{_event}}" }, { "type": "TEMPLATE", "key": "arg1", "value": "slider_interact" }] }
                    ]
                }
            ],
            "variable": [
                {
                    "name": "GA4 Measurement ID",
                    "type": "c",
                    "parameter": [{ "type": "TEMPLATE", "key": "value", "value": "G-XXXXXXXXXX" }]
                },
                {
                    "name": "DLV - Brand Name",
                    "type": "v",
                    "parameter": [{ "type": "TEMPLATE", "key": "name", "value": "brand_name" }, { "type": "INTEGER", "key": "dataLayerVersion", "value": "2" }]
                }
            ]
        }
    };

    return JSON.stringify(json, null, 2);
}

export function downloadGtmJson(site) {
    const json = generateGtmJson(site.gtmId);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GTM-${site.gtmId || 'CONFIG'}-${site.brand}.json`;
    a.click();
}
