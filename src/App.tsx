import './App.css'
import { WalletProvider } from '~/hooks/WalletProvider'
import { WalletError } from './components/WalletError'
import HomePage from './pages/HomePage/HomePage'
import Navbar from './components/Navbar/Navbar'
import { NetworkProvider } from './hooks/NetworkProvider'


function App() {
  return (
    <WalletProvider>
      <NetworkProvider>
        <Navbar />
        <WalletError />
        <HomePage />
      </NetworkProvider>
    </WalletProvider>
  )
}

export default App
