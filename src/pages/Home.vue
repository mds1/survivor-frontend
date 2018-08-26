<template>
  <!-- if you want automatic padding use "layout-padding" class -->
  <div class="layout-padding">

    <!-- your content -->
    <h2 style='margin-bottom:-3rem'>NFL Survivor</h2>
    <h5>Provably Fair and Open Source</h5>
    <!-- <p>This is the home page for the Ethereum survivor contract {{ contract.options.address }} </p> -->
    <!-- <p>This contract is managed by {{ this.$store.state.contract.owner }}</p> -->
    <!-- <p>There are currently XX players entered competing for a prize of YY ETH!</p> -->
    <p>{{ this.$store.state.contract.players.length }} players entered</p>
    <p class='join'> {{ this.$store.state.contract.balance }} ETH up for grabs!</p>

    <hr>
    <br>
    <div v-if=!this.$store.state.contract.userHasJoined>
      <app-join-pool/>
    </div>
    <div v-else>
      <app-make-pick/>
    </div>

    <br>

    <app-deadline/>

  </div>
</template>

<script>
import survivor from '@ethereum/survivorInstance.js';
import JoinPool from '@contract/JoinPool.vue';
import MakePick from '@contract/MakePick.vue';
import Deadline from '@contract/Deadline.vue';

export default {
  data() {
    return {
      contract: survivor,
    };
  },

  components: {
    appJoinPool: JoinPool,
    appMakePick: MakePick,
    appDeadline: Deadline,
  },

  created() {
    // Get contract properties since they're used on this page
    this.$store.dispatch('setPlayers'); // get list of players
    this.$store.dispatch('setBalance'); // get contract balance
    this.$store.dispatch('setEntryFee'); // get contract balance
    this.$store.dispatch('setUserHasJoined'); // has the visitor joined the pool
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="stylus" scoped>
@import '~variables';

.main {
  margin-top: auto;
}

.join {
  font-size: 1.2 rem;
  font-weight: bold;
  color: $primary;
}
</style>
