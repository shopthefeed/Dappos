// import something here
import notify from '../helpers/NotifyHelper'
import { hasClass, addClass, removeClass } from '../helpers/DOMClassHelpers'
// leave the export, even if you don't use it
export default ({ app, router, Vue, store }) => {
  window.QNotify = notify
  //
}
