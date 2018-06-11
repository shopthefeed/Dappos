import Vue from 'vue'
import { defaultMutations } from 'vuex-easy-access'
import currency from './settingsCurrency'
import copyObj from '../../helpers/copyObj'

function initialState () {
  return {
    walletAddress: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
    gas: 42000,
    settingsPatchQueueing: null,
    sendingSettingsPatchesToServer: false,
    modal: {state: false}
  }
}

export default {
  namespaced: true,
  modules: {
    currency,
  },
  state: initialState(),
  mutations:
  {
    resetStateData (state) {
      let newState = initialState()
      Object.assign(state, newState)
    },
    updateState (state, payload) {
      Object.keys(payload).forEach(key => {
        Vue.set(state, key, payload[key])
      })
    },
    replaceSettings (state, payload) {
      console.log('payload → ', payload)
      // Object.keys(payload).forEach(key => {
      //   Vue.set(state, key, payload[key])
      // })
    },
    ...defaultMutations(initialState())
  },
  actions:
  {
    toggleModal ({state, getters, rootState, rootGetters, commit, dispatch},
    toggleState) {
      toggleState = (toggleState === undefined) ? !state.modal.state : toggleState
      state.modal.state = toggleState
    },
    openDBChannel ({state, getters, rootState, rootGetters, commit, dispatch}) {
      getters.userSettingsDoc.onSnapshot(doc => {
        if (!doc.exists) { return }
        let source = doc.metadata.hasPendingWrites ? 'Local' : 'Server'
        console.log('Retrieved userSettings from ', source, ' data: ', doc && doc.data())
        if (source === 'Server') {
          commit('replaceSettings', doc.data().settings)
        }
      }, error => {
        let message = rootGetters.text.api.connectionError
        notify({message, preset: 'error'})
      })
    },
    patch ({dispatch, getters, state, rootState, rootGetters}) {
      if (!rootGetters['user/isSignedIn']) { return }
      // dispatch('startPatching')
      if (state.settingsPatchQueueing) { clearTimeout(state.settingsPatchQueueing) }
      function startPatchQueue () {
        state.settingsPatchQueueing = setTimeout(_ => {
          if (state.sendingSettingsPatchesToServer) {
            return startPatchQueue()
          }
          // Hard copy the syncStack
          let settings = copyObj(state)
          console.log('settings → ', settings)
          // Set sending status for next patchQueue invokes during it's being sent.
          state.sendingSettingsPatchesToServer = true
          getters.userSettingsDoc.set(settings, {merge: true})
          .then(_ => {
            // dispatch('stopPatching')
            console.log('patched User settings!')
            state.sendingSettingsPatchesToServer = false
          })
          .catch(error => dispatch('apiError', {error, note: 'Error during Settings patch'}, {root: true}))
        }, 750)
      }
      startPatchQueue()
    },
  },
  getters:
  {
    userSettingsDoc: (state, getters, rootState, rootGetters) => {
      if (!rootGetters['user/isSignedIn']) { return }
      return window.db.collection('users').doc(rootGetters['user/id']).collection('data').doc('settings')
    }
  }
}
