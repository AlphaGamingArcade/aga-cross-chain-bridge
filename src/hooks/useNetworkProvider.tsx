import { useContext } from 'react'
import { NetworkProviderContext } from './NetworkProvider'

export const useNetworkProvider = () => useContext(NetworkProviderContext)