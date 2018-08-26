<template>
  <!-- main file for sending transaction to smart contract -->
  <div>
    <div class="form">

      <form @submit.prevent='formSubmitted'>

        <q-select
        v-model="pick"
        :options="teams"
        float-label="Select team for this week"
        placeholder="Select team for this week"
        :dark=true
        />

        <br>
        <p class='small-font'>You are entering from address {{this.$store.state.network.currentAddress}}</p>
        <q-toggle v-model="showPickHistory" label="Toggle your pick history" :left-label=true :dark=true class='history' />
        <div class='history' v-if=showPickHistory >
          <ul id="example-1">
            <li v-for="team in this.$store.state.network.picks" :key="team.id" style="font-style:italic">
              {{ team }}
            </li>
          </ul>
        </div>
        <br>
        <br>

        <!-- button to send transaction -->
        <q-btn :loading='txsent' color="primary" text-color="text2" :disabled='txsent' v-on:click="formSubmitted">
          Submit pick
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
      pick: '',
      teams: [],
      showPickHistory: false
    }
  },

  created() {
    // Generate list of teams
    for (let i=1; i<33; i++) {
      const team = functions.integer2team(i);

      this.teams.push({
        label: team,
        value: i
      })
    }
  },

  validations: {
  },

  methods: {
    async formSubmitted() {
      // Validate data and state, and then send the transaction

      let _this = this // used to access props within promise
      this.txsent = true // update status of transaction

      // Get list of accounts to send tx
      const accounts = await web3.eth.getAccounts()

      // Ensure account is unlocked and that user is on the correct network
      // Returns true if both conditions are met, otherwise returns false
      if (!functions.performNetworkChecks(_this, accounts)) {
        this.txsent = false;
        return
      }

      // Send tx
      const pick = String(parseInt(this.pick)) // ensure this is an integer
      await survivor.methods
        .makePick(pick)
        .send({from: accounts[0]})

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
@import '~variables';

.history {
  color: $text2;
  font-size: 0.9 rem;
  margin-bottom: 0.1 rem;
}

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
  margin-bottom: 0.1 rem;
}
</style>
