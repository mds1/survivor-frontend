<template>
  <!-- if you want automatic padding use "layout-padding" class -->
  <div>

    <nav class="nav-bar">
      <nav class="wrapper">

        <!-- Left-aligned site name / link to home page -->
        <a href="https://www.ethereum.org/" target="_blank">
          <img src="../../statics/ethereum-logo.png" alt="Ethereum logo" height=70px>
        </a>

        <!-- Right-aligned links to other pages -->
        <!-- home page -->
        <ul>
          <router-link to='/' tag='li' active-class='active-page' exact>
            <a>
              Home
            </a>
          </router-link>

          <!-- add spaces -->
          &nbsp;&nbsp;&nbsp;&nbsp;

          <!-- Smart contract source code page -->
          <router-link :to='{ name: "standings"}' tag='li' active-class='active-page'>
            <a>
              Standings
            </a>
          </router-link>

          <!-- add spaces -->
          &nbsp;&nbsp;&nbsp;&nbsp;

          <!-- Smart contract source code page -->
          <router-link :to='{ name: "contractSource"}' tag='li' active-class='active-page'>
            <a>
              Contract
            </a>
          </router-link>

          <!-- add spaces -->
          &nbsp;&nbsp;&nbsp;&nbsp;

          <!-- FAQ -->
          <router-link :to='{ name: "faq"}' tag='li' active-class='active-page'>
            <a>
              FAQ
            </a>
          </router-link>
        </ul>

      </nav>
    </nav>
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },
};
</script>

<style lang="stylus" scoped>
// "variables" is a Webpack alias (defined in /config/index.js) which points
// to /src/themes/quasar.variables.styl
@import '~variables';

// set color of links
.header-links {
  color: $primary;
}

// set formatting of active page
.active-page {
  font-weight: bold;
}

// format full screen navigation bar
// source: http://blog.christopherianmurphy.com/2016/01/responsive-pure-css-menu/)
.wrapper {
  margin: 0 auto; // center content
  max-width: 960px;
  padding: 0 2%;
}

.nav-bar {
  background-color: $background;
  min-width: 100%; // ensure bar spans full page width
  margin-top: 20px;
}

nav {
  .wrapper {
    align-items: center; // vertically center items
    display: flex;
    // below line evenly distributes child elements within the parent flex
    // container, effectively floating logo to the left and menu items to the right
    justify-content: space-between;
  }
}

nav {
  ul {
    display: flex;
    justify-content: flex-end; // use flexbox to dynamically adjust spacing between menu items
    list-style-type: none;
    width: 40%; // set width of page that menu items should take up

    a {
      color: $text2;
      text-decoration: none;
      transition: all 0.5s ease;

      &:hover {
        font-weight: bold;
      }
    }
  }

  li {
    display: inline-block; // ensures items do not stack
  }
}
</style>
