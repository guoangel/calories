<template>
  <q-page>
    <q-input
      v-model="newItem"
      placeholder="Add Item"
      @keyup.enter="addItem"
      class="bg-cyan-8"
      dark
      filled
      square
    >
      <template v-slot:append>
        <q-btn
          @click="addItem"
          icon="add"
          round
          dense
          flat
        />
      </template>
    </q-input>

    <q-list
      bordered
      separator
    >
      <q-item
        v-for="item in items"
        :key="item.id"
        class="bg-cyan-1"
      >
        <q-item-section>
          <q-item-label>{{ item.title }}</q-item-label>
        </q-item-section>

      </q-item>

    </q-list>    
  </q-page>
</template>

<script>
var qs = require('qs')

export default {
  name: 'IndexPage',
  data() {
    return {
      newItem: '',
      items: []
    }
  },
  methods: {
    getItems() {
      this.$q.loading.show()
      this.$axios.get(`${ process.env.API }/items`).then(response => {
        this.items = response.data
        this.$q.loading.hide()
      }).catch(err => {
        this.$q.dialog({
          title: 'Error',
          message: 'Could not download data.'
        })
      })
    },
    addItem() {
      this.$q.loading.show()
      let newItem = {
        id: Date.now(),
        title: this.newItem
      }
      let newItemQS = qs.stringify(newItem)
      this.$axios.post(`${ process.env.API }/createItem?${newItemQS}`).then(response => {
        this.items.push(newItem)
        this.$q.loading.hide()
      }).catch(err => {
        console.log('err: ', err)
      })
    }

  },
  created() {
    this.getItems()
  }
}
</script>