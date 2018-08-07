import Home from '@pages/Home.vue';
import ContractSource from '@pages/ContractSource.vue';
import FAQ from '@pages/FAQ.vue';
import Error404 from '@pages/Error404.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/contract', component: ContractSource, name: 'contractSource' },
  { path: '/faq', component: FAQ, name: 'faq' },
];

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: Error404,
  });
}

export default routes;
