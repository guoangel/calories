<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title class="text-center text-grand-hotel">
          PWA Calories Per Day
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-footer elevated>
      <transition
        appear
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
      >
        <q-banner inline-actions dense class="bg-grey-3 text-dark" v-if="showNotificationsBanner && notificationsSupported">
        <template v-slot:avatar>
          <q-avatar icon="eva-bell-outline" font-size="24px"/>
        </template>
          <b>Enable Notifications?</b>

          <template v-slot:action>
            <q-btn flat label="Yes" dense class="q-px-sm" @click="enableNotifications"/>
            <q-btn flat label="Later" dense class="q-px-sm" @click="showNotificationsBanner = false"/>
            <q-btn flat label="Never" dense class="q-px-sm" @click="neverShowAppNotificationBanner"/>
          </template>

        </q-banner>
      </transition>
      <transition
        appear
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
      >
        <q-banner inline-actions dense class="bg-primary text-white" v-if="showAppInstallBanner">
        <template v-slot:avatar>
          <q-avatar icon="eva-info-outline" color="white" text-color="grey-10" font-size="24px"/>
        </template>
          <b>Install Calories Caculation App?</b>

          <template v-slot:action>
            <q-btn flat label="Yes" dense class="q-px-sm" @click="installApp"/>
            <q-btn flat label="Later" dense class="q-px-sm" @click="showAppInstallBanner = false"/>
            <q-btn flat label="Never" dense class="q-px-sm" @click="neverShowAppInstallBanner"/>
          </template>

        </q-banner>
      </transition>
    </q-footer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
let qs = require('qs')
let deferredPrompt;
let reg;
export default {
  name: 'MainLayout',

  computed: {
    notificationsSupported() {
      if ('PushManager' in window) return true
      return false
    },
    serviceWorkerSupported() {
      if ('serviceWorker' in navigator) return true
      return false
    }
  },

  data () {
    return {
      showAppInstallBanner: false,
      showNotificationsBanner: false
    }
  },
  methods: {
    installApp() {
      // Hide the app provided install promotion
      this.showAppInstallBanner = false
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          this.neverShowAppInstallBanner()
        } else {
          console.log('User dismissed the install prompt');
        }
      });
    },
    neverShowAppInstallBanner() {
      this.showAppInstallBanner = false
      this.$q.localStorage.set('neverShowAppInstallBanner', true)
    },

    enableNotifications() {
      if (this.notificationsSupported) {
        Notification.requestPermission(result => {
          this.neverShowAppNotificationBanner()
          if (result == 'granted') {
            console.log('notification is granted')
            this.checkForExistingPushSubscription()
          }
        })
      }
    },
    neverShowAppNotificationBanner() {
      this.showNotificationsBanner = false
      this.$q.localStorage.set('neverShowNotificationsBanner', true)
    },

    checkForExistingPushSubscription() {
      if (this.serviceWorkerSupported && this.notificationsSupported) {
        navigator.serviceWorker.ready.then(swreg=> {
          reg=swreg
          return swreg.pushManager.getSubscription()
        }).then(sub => {
          if (!sub) this.createPushSubscription()
        })
      }
    },
    createPushSubscription() {
      let vapidPublicKey = 'BIxoTWzoYli__pdrvdX9lwAZPXEBjnSILFfitW41TTQjl3eChWw7CPuwt-q6j8yMfsMHjyxTMN6CLyzvPUYipn4'
      let vapidPublicKeyConverted = this.urlBase64ToUint8Array(vapidPublicKey)
      reg.pushManager.subscribe({
        applicationServerKey: vapidPublicKeyConverted,
        userVisibleOnly:true
      }).then(newSub => {
        let newSubJSon = newSub.toJSON()
        let newSubJSonQueryString = qs.stringify(newSubJSon)
        this.$q.loading.show()
        this.$axios.post(`${ process.env.API }/createSubscription?${newSubJSonQueryString}`).then(response => {
          this.$q.loading.hide()
          this.displaySubscribedNotification()
        }).catch(err => {
          if (!navigator.onLine) {
            this.$q.notify('Subscription created offline')
            this.$q.loading.hide()
          }
          console.log('err: ', err)
        })
      })
    },
    displaySubscribedNotification() {
      reg.showNotification("Your are subscribed!")
    },
    displayGrantedNotification() {
      new Notification("You are subscribed to notifications!")
      console.log('notification -----------------end ')
      /*
      if (this.serviceWorkerSupported && this.pushNotificationsSupported) {
        navigator.serviceWorker.ready.then(swreg => {
          swreg.showNotification("You're subscribed to notifications!", {
            body: 'Thanks for subscribing!',
            icon: 'icons/icon-128x128.png',
            image: 'icons/icon-128x128.png',
            badge: 'icons/icon-128x128.png',
            dir: 'ltr',
            lang: 'en-US',
            vibrate: [100, 50, 200],
            tag: 'confirm-notification',
            renotify: true,
            actions: [
              {
                action: 'hello',
                title: 'Hello',
                icon: 'icons/icon-128x128.png'
              },
              {
                action: 'goodbye',
                title: 'Goodbye',
                icon: 'icons/icon-128x128.png'
              }
            ]
          })
        })
      }
      */
    },
    urlBase64ToUint8Array(base64String) {
      //https://gist.github.com/Klerith/80abd742d726dd587f4bd5d6a0ab26b6
        var padding = '='.repeat((4 - base64String.length % 4) % 4);
        var base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        var rawData = window.atob(base64);
        var outputArray = new Uint8Array(rawData.length);

        for (var i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
  },
  mounted() {
    let neverShowAppInstallBanner = this.$q.localStorage.getItem('neverShowAppInstallBanner')

    if (!neverShowAppInstallBanner) {
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        setTimeout(() => {
          this.showAppInstallBanner = true
        }, 3000);
      });    
    }

    let neverShowNotificationsBanner = this.$q.localStorage.getItem('neverShowNotificationsBanner')

    if (!neverShowNotificationsBanner) {
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        setTimeout(() => {
          this.showNotificationsBanner = true
        }, 3000);
      });    
    }
  }
}
</script>