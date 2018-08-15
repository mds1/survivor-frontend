<template>
  <!-- if you want automatic padding use "layout-padding" class -->
  <div class="layout-padding">
    <!-- TODO: Finish implementing an FAQ page -->
    <h2>The Standings</h2>

    <q-table

    :data="tableData"
    :columns="columns"
    row-key="name"
    :dark=true
  />

  </div>
</template>

<script>
import { getTeams } from '@common/functions';

export default {
  data() {
    return {
      columns: [
        {
          name: 'players',
          required: true,
          label: 'Players',
          align: 'left',
          field: 'player',
          sortable: true,
        },
        {
          name: 'pick',
          required: true,
          label: "This Week's Pick",
          align: 'left',
          field: 'pick',
          sortable: true,
        },
      ],
    };
  },


  created() {
    /* eslint-disable prefer-destructuring */
    // Get contract properties since they're used on this page
    this.$store.dispatch('setPlayers'); // get list of players
    this.$store.dispatch('setBalance'); // get contract balance
    this.$store.dispatch('setEntryFee'); // get contract balance
  },

  computed: {
    tableData() {
      // Generate array to hold table data
      const tableData = [];
      // Get list of players
      const players = this.$store.state.contract.players;
      // Get each players pick
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const int = this.$store.state.contract.picks[i];
        const pick = int !== 0 ? getTeams(int) : 'No team selected';
        // Push pick to table data
        tableData.push({
          player,
          pick,
        });
      }
      return tableData;
    }, // end tableData()
  },

};
</script>

<style>
</style>
