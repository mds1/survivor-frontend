<template>
  <!-- main file for sending transaction to smart contract -->
  <div>
    <div class="form">

      <h5>Join now for 0.10 ETH!</h5>
      <p class='small-font'>You are entering from address {{this.$store.state.network.currentAddress}}</p>

      <form @submit.prevent='formSubmitted'>

        <!-- button to send transaction -->
        <q-btn :loading='txsent' color="primary" text-color="text2" :disabled='txsent' v-on:click="formSubmitted">
          Join the pool!
          <!-- configure button appearance for pending transactions  -->
          <q-spinner slot="loading" />
          <span slot="loading">&nbsp;&nbsp;Transaction pending...</span>
        </q-btn>


      </form>
    </div>  <!-- end form div  -->
  </div>
</template>

<script>
/* eslint-disable */
import survivor from '@ethereum/survivorInstance.js'
import web3 from '@ethereum/web3'
import * as functions from '@common/functions.js'

export default {
  data() {
    return {
      txsent: false,
      txhash: '',
      requiredNetwork: this.$store.state.network.required,
    }
  },

  validations: {
  },

  methods: {
    async formSubmitted() {
      // Validate data and state, and then send the transaction

      let _this = this // used to access props within promise
      this.txsent = true // update status of transaction

      // Get list of accounts
      const accounts = await web3.eth.getAccounts();

      // Ensure account is unlocked and that user is on the correct network
      // Returns true if both conditions are met, otherwise returns false
      if (!functions.performNetworkChecks(_this, accounts)) {
        this.txsent = false;
        return
      }

      // Send tx
      const valueInWei = web3.utils.toWei(String(this.$store.state.contract.entryFee), 'ether')
      await survivor.methods.joinPool().send({
        from: accounts[0],
        value: valueInWei,
      })

        .on('transactionHash', function(txhash) {
          // Save tx hash, update alert shown to user
          _this = functions.onTransactionHash(_this, txhash);
        }) // end .on('transactionHash')

        .on('receipt', function(receipt) {
          _this = functions.onReceipt(_this, receipt);
        }) // end .on(receipt)

        .catch(function(err) {
          functions.onCatch(_this, err);
        }) // end catch

        .finally(function() {
          // reset status of txsent flag, so user can send another tx if desired
          _this.txsent = false
        }) // end finally

    }, // end formSubmitted
  }, // end methods
} // end export default

</script>

<style lang="stylus" scoped>
.form, .inputs {
  margin: auto;
}

.form {
  max-width: 640px;
}

.inputs {
  max-width: 320px;
}

.small-font {
  font-size: 0.9 rem;
}

h5 {
  margin-bottom: 0.5 rem;
}
</style>
