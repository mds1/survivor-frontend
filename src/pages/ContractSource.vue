<template>
  <!-- if you want automatic padding use "layout-padding" class -->
  <div class="layout-padding">
    <!-- TODO: Finish this feature (embedded source code on Smart Contract tab) -->
    <h3>Smart Contract Source Code</h3>
    <p>This smart contract is located at
      <a :href='this.addressURL' target='_blank'>{{ this.address }}</a>
      <br>
      <br>
      In-line source code coming soon...
    </p>

    <!-- <p>{{ this.$store.state.contract.code }}</p>
    <pre>
      <code>

      </code>
    </pre> -->

  </div>
</template>

<script>
import survivor from '../ethereum/survivorInstance.js';
import { createEtherscanAddressLink } from '../components/common/functions';

export default {
  data() {
    return {
      // eslint-disable-next-line no-underscore-dangle
      address: survivor._address,
      addressURL: '',
    };
  },

  created() {
    // Get source code from Etherscan
    this.$store.dispatch('setSourceCode');
    // Get network and contract address
    const network = this.$store.state.network.required;
    // eslint-disable-next-line prefer-destructuring
    const address = this.address;
    // Generate transaction link
    this.addressURL = createEtherscanAddressLink(network, address);
  },

};
</script>

<style lang="stylus">
@import '~variables';

pre, code {
  // why "monospace, monospace"? see https://stackoverflow.com/questions/38781089/font-family-monospace-monospace
  font-family: monospace, monospace;
}

code {
  overflow: auto;
}

code {
  display: block;
  padding: 1rem;
  word-wrap: normal;
}

a {
  color: $hyperlink;
}
</style>
