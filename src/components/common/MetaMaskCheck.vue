<template>
  <div>
    <!-- once per "session" check to ensure: -->
    <!--   1. MetaMask is installed -->
    <!--   2. MetaMask account is unlocked -->
    <!--   3. MetaMask is connected to the correct network -->
    <!-- alert user if any of these conditions are not met -->
    <!-- here, a "session" counts as a visit to the site -->
    <!-- reloading the page starts a new "session" and thus shows the dialog again -->
    <!-- this component is used by App.vue -->

    <!-- Check that MetaMask is installed -->
    <div v-if="!this.$store.state.MetaMask.isInstalled">
      <q-dialog v-model="showDialog" stack-buttons prevent-close @ok="onOk">
        <!-- Dialog title -->
        <div slot='title' class='dialog-title'>
          {{ dialogTitle }}
        </div>

        <!-- Dialog body -->
        <div slot="body" class='dialog-body'>
          <p>
            You need to install MetaMask to use this site. To do so, follow the steps below:
            <ol>
              <!-- numbering and line breaks added manually, seems like they
              aren't working with QDialog component -->
              <li>1. Download and install <a href="https://metamask.io/" target="_blank">MetaMask</a></li>
              <br>
              <li>2. Enable the extension and create a Metamask account</li>
              <br>
              <li>3. Fund your account with Ether (get some on
                <a href="https://www.coinbase.com/join/58791de0ee4668007f43b1ff" target="_blank">
                Coinbase
                </a>
                with this referral link)
              </li>
              <br>
              <li>4. Come back to this site and get started!</li>
            </ol>
          </p>
        </div> <!-- end body text div  -->
      </q-dialog>
    </div> <!-- end "is MetaMask installed" div  -->

    <!-- Check that MetaMask is unlocked AND/OR connected to the required network -->
    <div id='asdf' v-if="(!this.$store.state.MetaMask.isUnlocked || !this.$store.state.MetaMask.isOnCorrectNetwork) && this.$store.state.MetaMask.isInstalled">
      <q-dialog v-model="showDialog" stack-buttons prevent-close @ok="onOk" color="#FFF">

        <!-- Dialog title -->
        <div slot='title' class='dialog-title'>
          {{ dialogTitle }}

        </div>

        <!-- Dialog body -->
        <div slot="body" class='dialog-body'>
          <p>
            {{ getDialogMessage() }}
          </p>
        </div> <!-- end body text div  -->
      </q-dialog>
    </div> <!-- end " is MetaMask unlocked AND/OR connected to required network" div -->

  </div>
</template>

<script>

export default {
  data() {
    return {
      dialogTitle: 'Hold up!',
    };
  },

  computed: {
    showDialog: {
      get() {
        return !this.$store.state.isMetaMaskInstalled || !this.$store.state.isMetaMaskUnlocked || !this.$store.state.isMetaMaskOnCorrectNetwork;
      },
      set(value) {
        return value;
      },
    },
  },

  methods: {
    // when props.ok() gets called, close dialog
    // eslint-disable-next-line no-unused-vars
    onOk(data) {
      this.showDialog = false;
    },

    // determine which message to show in the dialog
    getDialogMessage() {
      let msg;
      if (!this.$store.state.MetaMask.isOnCorrectNetwork && !this.$store.state.MetaMask.isUnlocked) {
        // MetaMask is on the wrong network AND locked
        msg = `You'll need to unlock MetaMask and connect to the ${this.$store.state.network.required} Network for this site to function properly.`;
      } else if (!this.$store.state.MetaMask.isOnCorrectNetwork) {
        // MetaMask is unlocked, but on the wrong network
        msg = `It looks like you're not connected to the right network. MetaMask must be connected to the ${this.$store.state.network.required} Network for this site to function properly.`;
      } else if (!this.$store.state.MetaMask.isUnlocked) {
        // MetaMask is on the correct network, but locked
        msg = 'It seems MetaMask is locked. Be sure to unlock MetaMask if you plan to interact with this site.';
      } else {
        // We should never get here
        msg = `This message shouldn't be showing, so please let the developer know you saw this. In the meantime, please make sure you have MetaMask installed, unlocked, and connected to the ${this.$store.state.network.required} Network for this site to function properly.`;
      }

      return msg;
    }, // end getDialogMessage
  }, // end methods
}; // end export default

</script>

<style lang="stylus" >
@import '~variables';

.dialog-title {
  text-align: center;
  font-family: 'Avenir', Helvetica, Arial, sans-serif; // configure fonts to match main fonts specified in App.vue
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: $primary;
}

.dialog-body {
  font-family: 'Avenir', Helvetica, Arial, sans-serif; // configure fonts to match main fonts specified in App.vue
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: $text2;
}

.modal-content {
  background: $background;
}
</style>
