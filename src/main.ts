import './styles/base.css';
import './styles/game.css';
import { boot } from './game/index.js';
import { installE2EHook } from './dev/e2e-hook';

if (new URLSearchParams(location.search).has('e2e')) installE2EHook();
boot();
