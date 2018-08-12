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
export default {
  data: () => ({
    columns: [
      {
        name: 'player',
        required: true,
        label: 'Player',
        align: 'left',
        field: 'address',
        sortable: true,
      },
      {
        name: 'pick',
        required: true,
        label: 'Current Pick',
        align: 'left',
        field: 'pick',
        sortable: true,
      },
    ],
    tableData: [
      {
        address: '0xlksdjflksdjf',
        pick: 'A',
      },
      {
        address: '0x123123',
        pick: 'B',
      },
    ],
  }),

  created() {
    // Get contract properties since they're used on this page
    this.$store.dispatch('setPlayers'); // get list of players
    this.$store.dispatch('setBalance'); // get contract balance
    this.$store.dispatch('setEntryFee'); // get contract balance
  },

};
</script>

<style>
</style>
