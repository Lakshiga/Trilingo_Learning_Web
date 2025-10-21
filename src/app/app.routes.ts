import { Routes } from '@angular/router';
import { Home } from './Pages/home/home';
import { Features } from './Pages/features/features';
import { Games } from './Pages/games/games';
import { WordMatchGame } from './Pages/games/word-match-game/word-match-game';
import { FillInTheBlankGame } from './Pages/games/fill-in-the-blanks-game/fill-in-the-blanks-game';
import { MemoryPairGame } from './Pages/games/memory-pair-game/memory-pair-game';

export const routes: Routes = [
    { path: '', component:Home },
    { path: 'features', component:Features },
    { path: 'games', component:Games },
    {path:'word_match' , component:WordMatchGame},
    {path:'fill_in_blank' , component:FillInTheBlankGame},
    {path:'memory_pair' , component:MemoryPairGame},
    {path:'**' , redirectTo:''}
];
