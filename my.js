var options = {};

    var swVersion = "2.1.28";
    
    options.config = {
            userID: "wyfl33jhhcajgjeg",
            siteID: "aab2ca163e",
            api: {
                tokenapi: "https://stats.zestpush.com/api/token",
                analytics: "https://stats.zestpush.com/api/analytics",
                errorLog: "https://app.zestpush.com/api/public-log"
            },
            publicKey: "${firebase.VapidKey}",
            amp: {
                context: {
                    subscription: 'amp-web-push-subscription-state',
                    subscribe: 'amp-web-push-subscribe',
                    unsubscribe: 'amp-web-push-unsubscribe'
                }
            }
        };
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    function browserDetect(){
      if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1 || navigator.userAgent.indexOf(' OPR/') >= 0) {
        return('Opera');
      } else if (navigator.userAgent.indexOf("Edg") != -1) {
        return('Edge');
      } else if (navigator.userAgent.indexOf("Chrome") != -1) {
        return('Chrome');
      } else if (navigator.userAgent.indexOf("Safari") != -1) {
        return('Safari');
      } else if (navigator.userAgent.indexOf("Firefox") != -1) {
        return('Firefox');
      } else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true)) 
      {
        return('IExplorer');
      } else {
        return('Unknown');
      }
      }
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    function deviceModal(){
       const userAgent = navigator.userAgent;
       let deviceType = "";
    
       if (/Android/i.test(userAgent)) {
          deviceType = "Android";
        }
       else if (/iPhone|iPad/i.test(userAgent)) {
          deviceType = "iPhone";
        }
       else if (/Macintosh/i.test(userAgent)) {
          deviceType = "Mac";
        }
       else if (/Windows/i.test(userAgent)) {
          deviceType = "Windows";
        }
       else if (/Linux/i.test(userAgent)) {
          deviceType = "Linux";
        }
       else {
          deviceType = "Normal";
        }
       return deviceType;
    }
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    function getDeviceType() {
        var userAgent = navigator.userAgent;
        var isMobile = /Mobi/i.test(userAgent);
    
        if (isMobile) {
            return "Mobile";
        } else {
            return "Desktop";
        }
    }
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    function saveToken(data) {
            var tokendata = {data : data};
            tokendata.bw = browserDetect();
            tokendata.device_type = getDeviceType();
            tokendata.device_modal = deviceModal();
            var i = {
                method: "POST",
                body: JSON.stringify(tokendata),
                headers: {
                    "Content-Type": "application/json"
                }
                
            };
            return fetch(options.config.api.tokenapi, i).catch(function() {})
        }
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    function logError(error) {
            var errordata = {error : JSON.stringify(error)};
            errordata.site_id = options.config.siteID;
            errordata.sw_version = swVersion;
            errordata.user_id = options.config.userID;
            errordata.bw = browserDetect();
            errordata.device_type = getDeviceType();
            errordata.device_modal = deviceModal();
            errordata.app = "service-worker";
            console.log(errordata);
            var i = {
                method: "POST",
                body: JSON.stringify(errordata),
                headers: {
                    "userid": "service-worker",
                    "Content-Type": "application/json"
                }
            };
            return fetch(options.config.api.errorLog, i).catch(function() {})
        }
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    function getCurrentDateTime() {
      var currentDate = new Date();
      var zone = "+00:00";
      var currDate = currentDate.toISOString().replace("T", " ").slice(0, -5);
      try {
        var t = Date().match(/([\+-][0-9]+)/)[0].split("");
        zone = t[0] + t[1] + t[2] + ":" + t[3] + t[4]
            }catch(e){}
      return zone;
    }
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    function broadcastReply(command, payload) {
        self.clients.matchAll().then((clients) => {
            for (let i = 0; i < clients.length; i++) {
                const client = clients[i];
                client.postMessage({
                    command,
                    payload,
                });
            }
        });
    }
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    function onMessageReceivedSubscriptionState() {
        let retrievedPushSubscription = null;
        self.registration.pushManager
            .getSubscription()
            .then(pushSubscription => (retrievedPushSubscription = pushSubscription) ? self.registration.pushManager.permissionState(pushSubscription.options) : null)
            .then((permissionStateOrNull) => {
                (permissionStateOrNull == null)? broadcastReply(options.config.amp.context.subscription, !1) : (isSubscribed = !!retrievedPushSubscription &&  permissionStateOrNull === "granted" , broadcastReply(options.config.amp.context.subscription, isSubscribed));
                })
            }
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    function onMessageReceivedUnsubscribe() {
            self.registration.pushManager.getSubscription().then(function(e) {
                return !e || e.unsubscribe()
            }).then(function(e) {
                broadcastReply(options.config.amp.context.unsubscribe, null)
            }).catch(function(e) {
                broadcastReply(options.config.amp.context.unsubscribe, null)
            })
        }
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    async function onMessageReceivedSubscribe(site_id, user_id) {
        try {
    
            const existingSubscription = await self.registration.pushManager.getSubscription();
            if (existingSubscription) {
                handleSubscription(existingSubscription,site_id, user_id);
                return;
            }
    
            const subscription = await self.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(options.config.publicKey),
            });
    
            handleSubscription(subscription,site_id, user_id);
        } catch (error) {
            logError({
                        name: "Error during push subscription",
                        message: error.message,
                    })
        }
    }
    
    async function generateauthtoken(){
        try{
            let i = {
                method: "POST",
                body: JSON.stringify({"appId":"1:143878118513:web:71b96b763d1a988e434fd0","sdkVersion":"w:0.4.32"}),
                headers: {
                    "X-Goog-Api-Key": "AIzaSyDuLtaUFhcmvfaoTwuTdZvAo3SAd7gmCjk",
                    "Content-Type": "application/json"
                }
            };
            let install = await fetch("https://firebaseinstallations.googleapis.com/v1/projects/hindihelps-push/installations",i);
            let response = await install.json();
            let token = response.authToken.token;
            return token;
        }catch(error){
            return null;
        }
        return null;
    }
    
    async function generatetoken(subscription,authtoken){
        let endpoint= subscription.endpoint;
        let auth= subscription.keys.auth;
        let p256dh= subscription.keys.p256dh;
        try{
            let i = {
                method: "POST",
                body: JSON.stringify({"web":{"endpoint":endpoint,"auth":auth,"p256dh":p256dh,"applicationPubKey":options.config.publicKey}}),
                headers: {
                    "X-Goog-Api-Key": "AIzaSyDuLtaUFhcmvfaoTwuTdZvAo3SAd7gmCjk",
                    "X-Goog-Firebase-Installations-Auth":authtoken
                }
            };
            let install = await fetch("https://fcmregistrations.googleapis.com/v1/projects/hindihelps-push/registrations",i);
            let response = await install.json();
            let token = response.token;
            return token;
        }catch(error){
            return null;
        }
        return null;
    }
    
    async function handleSubscription(subscription,site_id, user_id) {
        try {
            broadcastReply(options.config.amp.context.subscribe, null);
    
            subscription = await subscription.toJSON();
    
            const authtoken = await generateauthtoken();
            let token = null;
            if(authtoken){
                token = await generatetoken(subscription,authtoken)
            }
            const allobj = {
                token,
                site_id : site_id,
                user_id : user_id,
                endpoint: subscription.endpoint,
                auth: subscription.keys.auth,
                p256dh: subscription.keys.p256dh,
                time_zone: getCurrentDateTime()
            };
            saveToken(allobj);
            saveData('token', token);
            saveData('notification_data', allobj);
            saveData('worker','zestpush');
        } catch (error) {
            logError({
                        name: "error handle subscription",
                        message: error.message,
                    })
        }
    }
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    function responseToserver(url, data) { 
            var i = {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json"
                }
                
            };                                            
            return new Promise(function(response, reject) {
                fetch(url, i).then(response).catch(function() {
                    setTimeout(function() {
                        fetch(url, i).then(response).catch(reject)
                    }, 500)
                })
            }
            )
        }
    
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    function notificationClick(event,clickAction){	
        var tag = event.notification.tag;
        var userId = event.notification.data["userId"];
        if(tag != "welcomeZest"){
        return responseToserver(options.config.api.analytics,{
            userbase:event.notification.data.userbase,
            pushid: event.notification.data.pushid,
            tag: tag,
            link : clickAction,
            site_id : options.config.siteID,
            user_id : options.config.userID,
            zest_data : event.notification.data.zest_data
        }).then(function(e) {
                    if (e) {
                        if (e.status >= 500)
                            throw new Error("Failed to record click. status:" + e.status);
                        if (e.status >= 400)
                            throw new Error("Invalid click params. status:" + e.status);
                    }
                }).catch(function(error) {
                    logError({
                        name: "error in click analytics",
                        message: error.message,
                        pushid: event.notification.data.pushid,
                        tag: tag,
                        action: clickAction
                       
                    })
                })
    }}
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function notificationOpenUrl(event,clickAction){
        // event.notification.close();
        event.waitUntil(clients.matchAll({
            type: 'window'
        }).then(function (clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url == clickAction && 'focus' in client)
                    return client.focus();
            }
            if (clients.openWindow)
                return clients.openWindow(clickAction);
        }
        ))
    }
    
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    self.addEventListener('notificationclick', (event) => {
        promises = [];
        clickAction = "";
        event.notification.onclick = function() {}, event.notification.close();
        if(event.action == null || event.action == ""){
            clickAction = event.notification.data.click_action;
    
        }else{
            clickAction = event.action;
        }
            promises.push(notificationClick(event,clickAction));
            promises.push(notificationOpenUrl(event,clickAction));
            event.waitUntil(Promise.all(promises));
    });
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    self.addEventListener('pushsubscriptionchange', async (event) => {
      
        await self.registration.unregister();
    
    });
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    self.addEventListener('push', (event) => {
        const payload = event.data.json();
        const payload_data = payload.notification
        if (payload && payload_data && "forcereset" in payload_data) {
        self.registration.update();
        }
        event.waitUntil(self.registration.pushManager.getSubscription().then(function(t) {
        
            const notidata = payload_data;
            console.log(notidata);
            
            
            function parseJSONSafe(jsonString, defaultValue = undefined) {
              try {
                if (typeof jsonString === 'string') {
                  return JSON.parse(jsonString);
                } else if (typeof jsonString === 'object' && jsonString !== null) {
                  // If it's already an object, return as it is
                  return jsonString;
                } else {
                  // console.error('Invalid JSON string');
                  return defaultValue;
                }
              } catch (error) {
                // console.error('Error parsing JSON:', error);
                return defaultValue;
              }
            }          
  
              if (payload_data && payload_data["swVersion"] &&  payload_data["swVersion"] !== swVersion) {
                  console.log("SW Version is different, Updating SW");
                  self.registration.update();
              }
              if (payload_data && payload_data["refreshToken"] &&  payload_data["refreshToken"] == "true") {
                  return null;
              };
              try{
      
              return self.registration.showNotification(notidata.title, {
                body: notidata.body ? notidata.body : undefined,
                tag: payload_data.tag ? payload_data.tag : undefined,
                icon: payload_data.icon ? payload_data.icon : undefined,
                image: payload_data.image ? payload_data.image : undefined,
                timestamp: payload_data ? payload_data["timestamp"] : undefined,
                vibrate: payload_data ? parseJSONSafe(payload_data["vibrate"]) : undefined,
                actions: payload_data ? parseJSONSafe(payload_data["actions"]) : undefined,
                badge: payload_data ? payload_data["badge_icon"] : undefined,
                renotify : true,
                requireInteraction:true,
                data: {
                  userbase: payload_data["userbase"],
                  pushid: payload_data["pushid"],
                  click_action: payload_data.click_action ? payload_data.click_action : undefined,
                  zest_data : payload_data.zest_data ? payload_data.zest_data : undefined
                },
              }
              }catch(err){ 
                  console.log(err);
                  return null;
              }
              );
          })
        );
      });
    
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    self.addEventListener("message", function(e) {
            const { command} = e.data;
            const site_id = options.config.siteID;
            const user_id = options.config.userID;
            if (command){
                switch (command) {
                case options.config.amp.context.subscription:
                    onMessageReceivedSubscriptionState();
                    break;
                case options.config.amp.context.subscribe:
                    onMessageReceivedSubscribe(site_id, user_id);
                    break;
                case options.config.amp.context.unsubscribe:
                    onMessageReceivedUnsubscribe()
            }}
        });
    
    self.addEventListener("activate", function(e) {
            console.log("service worker activate"),
            e.waitUntil(self.clients.claim())
        });
        
    self.addEventListener("install", function(e) {
            e.waitUntil(self.skipWaiting())
        });
    
    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    function openDatabase(){
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("zestpush", 1);
    
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                db.createObjectStore("zestpushDatabase", { keyPath: "id" });
            };
    
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
    
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    };
    
    function saveData(key, value){
      openDatabase()
        .then(db => {
          var transaction = db.transaction('zestpushDatabase', 'readwrite');
          var objectStore = transaction.objectStore('zestpushDatabase');
          var request = objectStore.put({ id: key, data: value });
    
          request.onsuccess = function() {
            // console.log('Data stored successfully');
          };
    
          transaction.oncomplete = function() {
            // console.log('Transaction completed');
            db.close();
          };
    
          transaction.onerror = function(event) {
            console.log('Error storing data:', event.target.error);
          };
        })
        .catch(error => {
          console.log('Error opening database:', error);
        });
    }
    
    async function readData(key){
        const db = await openDatabase();
        const transaction = db.transaction("zestpushDatabase", "readonly");
        const objectStore = transaction.objectStore("zestpushDatabase");
        const request = objectStore.get(key);
    
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result ? request.result.data : null);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    };
