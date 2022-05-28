<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title class="text-center">
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
let deferredPrompt;

export default {
  name: 'MainLayout',

  data () {
    return {
      showAppInstallBanner: false
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
  }
}
</script>
