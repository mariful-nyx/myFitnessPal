import React from 'react';
import Navigation from './navigation/Navigation';
import { MenuProvider } from 'react-native-popup-menu';

export default function App() 
{
  return (
    <MenuProvider>
      <Navigation />
    </MenuProvider>
  )}