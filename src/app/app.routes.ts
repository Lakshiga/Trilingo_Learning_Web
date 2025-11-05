import { Routes } from '@angular/router';
import { Home } from './Pages/home/home';
import { Library } from './Pages/library/library';
import { Games } from './Pages/games/games';
import { WordMatchGame } from './Pages/games/word-match-game/word-match-game';
import { FillInTheBlankGame } from './Pages/games/fill-in-the-blanks-game/fill-in-the-blanks-game';
import { MemoryPairGame } from './Pages/games/memory-pair-game/memory-pair-game';
import { VoiceRepeatGame } from './Pages/games/voice-repeat-game/voice-repeat-game';

export const routes: Routes = [
    { path: '', component:Home },
    { path: 'library', component:Library },
    { path: 'games', component:Games },
    {path:'word_match' , component:WordMatchGame},
    {path:'fill_in_blank' , component:FillInTheBlankGame},
    {path:'memory_pair' , component:MemoryPairGame},
    {path:'voice_repeat' , component:VoiceRepeatGame},
    {path:'**' , redirectTo:''}
];
