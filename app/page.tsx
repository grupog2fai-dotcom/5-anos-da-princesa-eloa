'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Gift, 
  Copy, 
  Check, 
  Send, 
  MessageSquare, 
  UserCheck, 
  Sparkles, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  QrCode, 
  UserPlus, 
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  Settings,
  KeyRound,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';

import { getSupabaseClient } from '../lib/supabase';

// Interfaces for our application data structures
interface GiftItem {
  id: number;
  name: string;
  image: string;
  status: 'Disponível' | 'Reservado' | 'Comprado';
  reservedBy?: string;
  shopeeUrl: string;
}

interface WallMessage {
  id: number;
  name: string;
  text: string;
  date: string;
}

interface Guest {
  id?: string | number;
  name: string;
  code?: string;
  companionsCount: number;
  isConfirmed?: boolean;
  responsibleAdult?: string;
  associatedChild?: string;
}

const PLAYLIST = [
  {
    title: "Clair de Lune (Debussy)",
    src: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Debussy_-_Clair_de_Lune.mp3"
  },
  {
    title: "Dança da Fada Açucarada (Tchaikovsky)",
    src: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Tchaikovsky%27s_Dance_of_the_Sugar_Plum_Fairy_-_The_Mesa_Symphony_Orchestra.mp3"
  }
];

export default function Home() {
  // --- STATE FOR ENVELOPE OPENING EXPERIENCE ---
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const [isOpening, setIsOpening] = useState<boolean>(false);

  // --- DYNAMIC MUSIC / AMBIENT AUDIO STATE ---
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [userMuted, setUserMuted] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.25);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- COUNTDOWN TIMER STATE ---
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    completed: false
  });

  // --- RSVP STATE ---
  const [rsvpQuery, setRsvpQuery] = useState<string>('');
  const [rsvpGuest, setRsvpGuest] = useState<Guest | null>(null);
  const [rsvpSearched, setRsvpSearched] = useState<boolean>(false);
  const [rsvpConfirmed, setRsvpConfirmed] = useState<boolean>(false);
  const [submittingRsvp, setSubmittingRsvp] = useState<boolean>(false);
  const [lastSentMessage, setLastSentMessage] = useState<{ name: string; text: string } | null>(null);

  // --- GIFT LIST STATE ---
  const [gifts, setGifts] = useState<GiftItem[]>([
    {
      id: 1,
      name: 'Câmera de Vídeo Digital Infantil Unicórnio',
      image: '/images/Eloa presentes/Camera de video digital unicornio.webp',
      status: 'Disponível',
      shopeeUrl: 'https://shopee.com.br/search?keyword=camera+de+video+digital+unicornio+infantil'
    },
    {
      id: 2,
      name: 'Mini Casinha de Boneca',
      image: '/images/Eloa presentes/Casinha de boneca.webp',
      status: 'Disponível',
      shopeeUrl: 'https://shopee.com.br/search?keyword=casinha+de+boneca+infantil'
    },
    {
      id: 3,
      name: 'Conjunto Moletom com Capuz Minnie Mouse',
      image: '/images/Eloa presentes/conjunto moletom minnie.webp',
      status: 'Disponível',
      shopeeUrl: 'https://shopee.com.br/search?keyword=conjunto+moletom+minnie+infantil'
    },
    {
      id: 4,
      name: 'Kit com 2 Tênis Infantil Menina Conforto',
      image: '/images/Eloa presentes/Kit 2 Tenis Infantil Menina.webp',
      status: 'Disponível',
      shopeeUrl: 'https://shopee.com.br/search?keyword=kit+2+tenis+infantil+menina'
    },
    {
      id: 5,
      name: 'Kit 6 Peças Conjunto Moletom Menina',
      image: '/images/Eloa presentes/Kit 6 Peças Conjunto Moletom Infantil Menina.webp',
      status: 'Disponível',
      shopeeUrl: 'https://shopee.com.br/search?keyword=kit+6+pecas+moletom+infantil+menina'
    },
    {
      id: 6,
      name: 'Maleta Médica de Brinquedo Infantil',
      image: '/images/Eloa presentes/Maleta medica.webp',
      status: 'Disponível',
      shopeeUrl: 'https://shopee.com.br/search?keyword=maleta+medica+brinquedo+infantil'
    },
    {
      id: 7,
      name: 'Tênis Calçado Infantil Feminino com Led',
      image: '/images/Eloa presentes/Tenis Calçado Sapato Infantil Feminino com luz.webp',
      status: 'Disponível',
      shopeeUrl: 'https://shopee.com.br/search?keyword=tenis+infantil+feminino+com+luz'
    },
    {
      id: 8,
      name: 'Tênis Esportivo Infantil para Corrida',
      image: '/images/Eloa presentes/Tenis para criança malha de couro corrida esportiva.png',
      status: 'Disponível',
      shopeeUrl: 'https://shopee.com.br/search?keyword=tenis+infantil+menina+corrida'
    },
    {
      id: 9,
      name: 'Conjunto Moletom Agasalho de Inverno',
      image: '/images/Eloa presentes/Conjunto infantil feminino de inverno agasalho menina.webp',
      status: 'Disponível',
      shopeeUrl: 'https://shopee.com.br/search?keyword=conjunto+infantil+feminino+de+inverno'
    }
  ]);
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [reserveName, setReserveName] = useState<string>('');

  // States for dynamic Shopee gifts manager (Admin Mode)
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [adminPasscode, setAdminPasscode] = useState<string>('');
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<GiftItem | null>(null);

  // States for adding a new gift
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemShopeeUrl, setNewItemShopeeUrl] = useState<string>('');
  const [newItemImage, setNewItemImage] = useState<string>('/images/Eloa presentes/Camera de video digital unicornio.webp');


  // Centralized wrapper to persist state changes
  const updateGiftsStateAndSave = (newGifts: GiftItem[] | ((prev: GiftItem[]) => GiftItem[])) => {
    setGifts(prev => {
      const resolved = typeof newGifts === 'function' ? newGifts(prev) : newGifts;
      localStorage.setItem('eloa_gifts_v3', JSON.stringify(resolved));
      return resolved;
    });
  };

  // --- PIX STATE ---
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const pixKey = "11951605888";
  const pixFavored = "Samanta Alexandra do Carmo Gomes";

  // --- GALLERY STATE ---
  const galleryCategories = [
    { id: 'todos', label: 'Todos' },
    { id: 'primeiros', label: 'Primeiros Anos' },
    { id: 'familia', label: 'Família' },
    { id: 'amigos', label: 'Amigos' },
    { id: 'especiais', label: 'Momentos Especiais' },
    { id: 'atuais', label: 'Fotos Atuais' }
  ];
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const galleryImages = [
    { id: 1, src: '/images/eloa_1_denim_jacket.jpg', category: 'atuais', title: 'Reflexiva e Charmosa' },
    { id: 2, src: '/images/eloa_2_sleeping_giraffe.jpg', category: 'especiais', title: 'Soninho da Princesa' },
    { id: 3, src: '/images/eloa_3_green_dress.jpg', category: 'atuais', title: 'Sorriso de Boneca' },
    { id: 4, src: '/images/eloa_4_beach_peace.jpg', category: 'primeiros', title: 'Diversão na Praia' },
    { id: 5, src: '/images/eloa_5_posing_visor.jpg', category: 'atuais', title: 'Pose de Modelo' },
    { id: 6, src: '/images/eloa_6_stitch_sleepwear.jpg', category: 'familia', title: 'Momentos em Família' },
    { id: 7, src: '/images/eloa_7_cream_sweater.jpg', category: 'atuais', title: 'Estilo de Princesinha' },
    { id: 8, src: '/images/eloa_8_orange_slide.jpg', category: 'amigos', title: 'Alegria de Brincar' },
    { id: 9, src: '/images/eloa_9_adidas_tracksuit.jpg', category: 'atuais', title: 'Moderninha e Alegre' },
  ];

  const filteredGallery = activeCategory === 'todos' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === activeCategory);

  // --- MURAL DE MENSAGENS STATE ---
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [wallName, setWallName] = useState<string>('');
  const [wallText, setWallText] = useState<string>('');
  const [messageSubmitted, setMessageSubmitted] = useState<boolean>(false);

  // Load gifts from localStorage on mount safely
  useEffect(() => {
    const saved = localStorage.getItem('eloa_gifts_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTimeout(() => {
          setGifts(parsed);
        }, 0);
      } catch (err) {
        console.error('Error loading saved gifts:', err);
      }
    }
  }, []);

  // Load messages from Supabase if available/configured, falling back to localStorage
  useEffect(() => {
    let active = true;

    const loadMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.statusText}`);
        }
        const data = await response.json();
        if (data && Array.isArray(data)) {
          // Map Supabase rows to WallMessage format
          const mapped: WallMessage[] = data.map((item: any) => ({
            id: Number(item.id) || (Date.now() + Math.random()),
            name: item.name || 'Secreto',
            text: item.text || '',
            date: item.date || new Date().toLocaleDateString('pt-BR')
          }));
          
          if (active) {
            setMessages(mapped);
            try {
              localStorage.setItem('eloa_messages_v3', JSON.stringify(mapped));
            } catch (lsErr) {
              console.error('Failed to sync to localStorage:', lsErr);
            }
          }
        } else {
          loadFromLocalStorage();
        }
      } catch (err) {
        console.error('Failed to query messages API or parse:', err);
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      const savedMsgs = localStorage.getItem('eloa_messages_v3');
      const baseList: WallMessage[] = savedMsgs ? JSON.parse(savedMsgs) : [];

      if (active) {
        setMessages(baseList);
        try {
          localStorage.setItem('eloa_messages_v3', JSON.stringify(baseList));
        } catch (lsErr) {
          console.error('Failed to sync fallback list to localStorage:', lsErr);
        }
      }
    };

    loadMessages();

    return () => {
      active = false;
    };
  }, []);

  // --- MOCK RSVP BANK SEARCH ---
  const mockGuests: { [key: string]: Guest } = {
    'ZECA': { id: 'G-1', name: 'Zeca', companionsCount: 1, associatedChild: 'Mavis' },
    'MAVIS': { id: 'G-1-C', name: 'Mavis', companionsCount: 0, responsibleAdult: 'Zeca' },
    'GABRIEL': { id: 'G-2', name: 'Gabriel', companionsCount: 0 },
    'DAYANE': { id: 'G-3', name: 'Dayane', companionsCount: 0 },
    'LARISSA': { id: 'G-4', name: 'Larissa', companionsCount: 0 },
    'EMANUEL': { id: 'G-5', name: 'Emanuel', companionsCount: 0 },
    'MARI': { id: 'G-6', name: 'Mari', companionsCount: 0 },
    'MATHEUS': { id: 'G-7', name: 'Matheus', companionsCount: 0 },
    'DUDA': { id: 'G-8', name: 'Duda', companionsCount: 0 },
    'VITOR': { id: 'G-9', name: 'Vitor', companionsCount: 0 },
    'GILMAR': { id: 'G-10', name: 'Gilmar', companionsCount: 0 },
    'DILMAR': { id: 'G-11', name: 'Dilmar', companionsCount: 0 },
    'LUIZA': { id: 'G-12', name: 'Luiza', companionsCount: 0 },
    'FATIMA': { id: 'G-13', name: 'Fátima', companionsCount: 0 },
    'EMERSON': { id: 'G-15', name: 'Emerson', companionsCount: 0 },
    'SUELI': { id: 'G-16', name: 'Sueli', companionsCount: 4, associatedChild: 'Livia, Manu, Lucas e Isaac' },
    'LIVIA': { id: 'G-16-C1', name: 'Livia', companionsCount: 0, responsibleAdult: 'Sueli' },
    'MANU': { id: 'G-16-C2', name: 'Manu', companionsCount: 0, responsibleAdult: 'Sueli' },
    'LUCAS': { id: 'G-16-C3', name: 'Lucas', companionsCount: 0, responsibleAdult: 'Sueli' },
    'ISAAC': { id: 'G-16-C4', name: 'Isaac', companionsCount: 0, responsibleAdult: 'Sueli' },
    'MIGUEL': { id: 'G-17', name: 'Miguel', companionsCount: 0 },
    'REBECA': { id: 'G-18', name: 'Rebeca', companionsCount: 0 },
    'DANIELE': { id: 'G-21', name: 'Daniele', companionsCount: 0 },
    'ANTONIO': { id: 'G-22', name: 'Antônio', companionsCount: 0 },
    'MARCOS': { id: 'G-23', name: 'Marcos', companionsCount: 0 },
    'SEBASTIANA': { id: 'G-24', name: 'Sebastiana', companionsCount: 0 },
    'KAKA': { id: 'G-25', name: 'Kaka', companionsCount: 0 },
    'NAYARA': { id: 'G-26', name: 'Nayara', companionsCount: 1, associatedChild: 'Elisa' },
    'ELISA': { id: 'G-26-C1', name: 'Elisa', companionsCount: 0, responsibleAdult: 'Nayara' },
    'NAYRA': { id: 'G-27', name: 'Nayra', companionsCount: 3, associatedChild: 'Bia, Pedro e Isabelly' },
    'BIA': { id: 'G-27-C1', name: 'Bia', companionsCount: 0, responsibleAdult: 'Nayra' },
    'PEDRO': { id: 'G-27-C2', name: 'Pedro', companionsCount: 0, responsibleAdult: 'Nayra' },
    'ISABELLY': { id: 'G-27-C3', name: 'Isabelly', companionsCount: 0, responsibleAdult: 'Nayra' },
    'BEATRIZ': { id: 'G-31', name: 'Beatriz', companionsCount: 0 },
    'ALESSANDRA': { id: 'G-32', name: 'Alessandra', companionsCount: 0 },
    'SABRINA': { id: 'G-33', name: 'Sabrina', companionsCount: 0 },
    'JACIARA': { id: 'G-34', name: 'Jaciara', companionsCount: 0 },
    'DAVID': { id: 'G-35', name: 'David', companionsCount: 1, associatedChild: 'Jonathan' },
    'JONATHAN': { id: 'G-35-C1', name: 'Jonathan', companionsCount: 0, responsibleAdult: 'David' },
    'TAIS': { id: 'G-36', name: 'tais', companionsCount: 0 }
  };

  // --- COUNTDOWN EFFECT ---
  useEffect(() => {
    const targetDate = new Date('2026-06-13T16:00:00-03:00').getTime(); // Event time in BRT

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, completed: true });
      } else {
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ days: d, hours: h, minutes: m, seconds: s, completed: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // --- AUDIO PLAYER CONTROLS & AUTO-TRIGGER ENGINE ---
  // Synchronize volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

  useEffect(() => {
    const startAudioOnInteraction = () => {
      if (userMuted) return; // Se o usuário silenciou manualmente, respeitar a escolha

      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.volume = audioVolume;
          audioRef.current.play()
            .then(() => {
              setIsPlayingAudio(true);
              cleanupListeners();
            })
            .catch(err => {
              console.log("Autoplay interaction blocked/deferred:", err);
            });
        } else {
          setIsPlayingAudio(true);
          cleanupListeners();
        }
      }
    };

    const cleanupListeners = () => {
      window.removeEventListener('click', startAudioOnInteraction);
      window.removeEventListener('touchstart', startAudioOnInteraction);
      window.removeEventListener('mousedown', startAudioOnInteraction);
    };

    // Registrar ouvintes em múltiplos eventos de toque e clique para robustez máxima
    window.addEventListener('click', startAudioOnInteraction, { passive: true });
    window.addEventListener('touchstart', startAudioOnInteraction, { passive: true });
    window.addEventListener('mousedown', startAudioOnInteraction, { passive: true });

    // Tentativa instantânea de tocar ao montar ou carregar
    const instantPlayTimeout = setTimeout(() => {
      if (userMuted) return;
      if (audioRef.current) {
        audioRef.current.volume = audioVolume;
        audioRef.current.play()
          .then(() => {
            setIsPlayingAudio(true);
            cleanupListeners();
          })
          .catch(() => {
            // Bloqueado pelo navegador até o primeiro clique; perfeitamente normal
          });
      }
    }, 150);

    return () => {
      cleanupListeners();
      clearTimeout(instantPlayTimeout);
    };
  }, [currentTrackIndex, userMuted, audioVolume]); // No longer depends on isPlayingAudio to avoid infinite re-trigger loop

  // Synchronize audio element when currentTrackIndex changes
  useEffect(() => {
    if (audioRef.current) {
      const wasPlaying = !audioRef.current.paused;
      audioRef.current.pause();
      audioRef.current.src = PLAYLIST[currentTrackIndex].src;
      audioRef.current.load();
      if ((wasPlaying || isPlayingAudio) && !userMuted) {
        audioRef.current.play()
          .then(() => setIsPlayingAudio(true))
          .catch(e => console.log("Track switch play deferred:", e));
      }
    }
  }, [currentTrackIndex, userMuted, isPlayingAudio]);

  const togglePlayAudio = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Previne propagações indesejadas
    }

    if (audioRef.current) {
      if (!audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
        setUserMuted(true); // Usuário silenciou explicitamente
      } else {
        setUserMuted(false); // Remove silenciamento manual
        audioRef.current.volume = audioVolume;
        audioRef.current.play()
          .then(() => setIsPlayingAudio(true))
          .catch(e => {
            console.log("Direct play clicked, error:", e);
            // Tentar restaurar recarregando o recurso
            if (audioRef.current) {
              audioRef.current.load();
              audioRef.current.play()
                .then(() => setIsPlayingAudio(true))
                .catch(err => console.log("Reload-and-play failed:", err));
            }
          });
      }
    }
  };

  const changeVolume = (newVolume: number) => {
    setAudioVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const nextTrack = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const nextIdx = (currentTrackIndex + 1) % PLAYLIST.length;
    setCurrentTrackIndex(nextIdx);
    setIsPlayingAudio(true);
  };

  // --- HANDLE ENVELOPE OPENING ---
  const triggerOpening = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setUserMuted(false);
    setIsPlayingAudio(true);
    
    // Play audio synchronously directly during the click gesture event of opening the envelope
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
      audioRef.current.play()
        .then(() => {
          setIsPlayingAudio(true);
        })
        .catch(err => {
          console.log("Envelope opening sync play attempt failed, forced load fallback:", err);
          if (audioRef.current) {
            audioRef.current.load();
            audioRef.current.play()
              .then(() => setIsPlayingAudio(true))
              .catch(e => {
                console.log("Secondary reload sync attempt failed:", e);
                // Last-resort fallback: try after a brief timeout
                setTimeout(() => {
                  if (audioRef.current) {
                    audioRef.current.play()
                      .then(() => setIsPlayingAudio(true))
                      .catch(err3 => console.log("Final post-delay fallback failed:", err3));
                  }
                }, 50);
              });
          }
        });
    }

    setIsOpening(true);
    setTimeout(() => {
      setIsOpened(true);
    }, 1500); // Duration matches animation sequence
  };

  // --- HANDLE PIX KEY COPY ---
  const copyPixToClipboard = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => {
      setCopiedPix(false);
    }, 3000);
  };

  // --- HANDLERS FOR RSVP VALIDATION ---
  const handleRsvpCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpQuery.trim()) return;

    setSubmittingRsvp(true);
    
    try {
      let foundGuest: Guest | null = null;

      try {
        const response = await fetch('/api/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'search', query: rsvpQuery.trim() })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const dbGuest = data[0];
            foundGuest = {
              id: dbGuest.id,
              name: dbGuest.name,
              code: dbGuest.code,
              companionsCount: dbGuest.companions_count ?? 0,
              isConfirmed: dbGuest.is_confirmed ?? false,
              responsibleAdult: dbGuest.responsible_adult,
              associatedChild: dbGuest.associated_child
            };
          }
        }
      } catch (apiErr) {
        console.error("Supabase API search error:", apiErr);
      }

      // Seamless fallback to offline predefined guest list if Supabase is unconfigured or not matching
      if (!foundGuest) {
        const searchKey = rsvpQuery
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
          .trim();
        
        for (const guest of Object.values(mockGuests)) {
          const guestNameNorm = guest.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .trim();
            
          if (guestNameNorm.includes(searchKey) || searchKey.includes(guestNameNorm)) {
            foundGuest = guest;
            break;
          }
        }
      }

      setRsvpGuest(foundGuest);
      setRsvpSearched(true);
    } catch (err) {
      console.error("RSVP search error:", err);
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const handleRsvpConfirm = async () => {
    setSubmittingRsvp(true);
    
    try {
      if (rsvpGuest && rsvpGuest.id) {
        try {
          const response = await fetch('/api/rsvp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'confirm', guestId: rsvpGuest.id })
          });

          if (!response.ok) {
            console.error("Failed RSVP API confirmation update:", response.statusText);
          }
        } catch (apiErr) {
          console.error("Supabase API confirmation error:", apiErr);
        }
      }
      
      // Complete confirmation experience visually
      setRsvpConfirmed(true);

      // Trigger automatic WhatsApp redirection
      if (rsvpGuest) {
        const companionsText = rsvpGuest.companionsCount > 0 
          ? ` com +${rsvpGuest.companionsCount} acompanhante(s)` 
          : ' (Entrada Individual)';
        const rsvpCodeText = rsvpGuest.code ? ` (Convite: ${rsvpGuest.code})` : '';
        const waText = `Olá! Confirmo minha presença no aniversário da Princesa Eloá! 👑✨\n\nConvidado: *${rsvpGuest.name}*${rsvpCodeText}${companionsText}\nStatus: *Presença Confirmada!*`;
        const waUrl = `https://wa.me/5511951605888?text=${encodeURIComponent(waText)}`;
        
        try {
          window.open(waUrl, '_blank');
        } catch (winErr) {
          console.error("Popup blocker prevented WhatsApp redirect", winErr);
        }
      }
    } catch (err) {
      console.error("RSVP confirm sequence error:", err);
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const resetRsvp = () => {
    setRsvpQuery('');
    setRsvpGuest(null);
    setRsvpSearched(false);
    setRsvpConfirmed(false);
  };

  // --- HANDLERS FOR GIFT LIST SUGGESTIONS ---
  const openReserveModal = (item: GiftItem) => {
    if (item.status !== 'Disponível') return;
    setSelectedGift(item);
  };

  const handleReserveGiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveName.trim() || !selectedGift) return;

    updateGiftsStateAndSave(prev => prev.map(item => {
      if (item.id === selectedGift.id) {
        return {
          ...item,
          status: 'Reservado',
          reservedBy: reserveName.trim()
        };
      }
      return item;
    }));

    setSelectedGift(null);
    setReserveName('');
  };

  // --- ADMIN HANDLERS FOR GIFT LIST ---
  const handleAddGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemShopeeUrl.trim()) return;

    let formattedUrl = newItemShopeeUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const newGiftItem: GiftItem = {
      id: Date.now(),
      name: newItemName.trim(),
      shopeeUrl: formattedUrl,
      image: newItemImage,
      status: 'Disponível'
    };

    updateGiftsStateAndSave(prev => [...prev, newGiftItem]);
    setNewItemName('');
    setNewItemShopeeUrl('');
  };

  const handleDeleteGift = (id: number) => {
    updateGiftsStateAndSave(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItemField = (id: number, field: keyof GiftItem, value: any) => {
    updateGiftsStateAndSave(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleResetGiftsToDefault = () => {
    if (window.confirm('Deseja realmente redefinir a lista de presentes para os 9 modelos padrões de presentes da Shopee?')) {
      const defaultGifts: GiftItem[] = [
        {
          id: 1,
          name: "Câmera de Vídeo Digital Infantil Unicórnio",
          image: "/images/Eloa presentes/Camera de video digital unicornio.webp",
          status: "Disponível",
          shopeeUrl: "https://shopee.com.br/search?keyword=camera+de+video+digital+unicornio+infantil"
        },
        {
          id: 2,
          name: "Mini Casinha de Boneca",
          image: "/images/Eloa presentes/Casinha de boneca.webp",
          status: "Disponível",
          shopeeUrl: "https://shopee.com.br/search?keyword=casinha+de+boneca+infantil"
        },
        {
          id: 3,
          name: "Conjunto Moletom com Capuz Minnie Mouse",
          image: "/images/Eloa presentes/conjunto moletom minnie.webp",
          status: "Disponível",
          shopeeUrl: "https://shopee.com.br/search?keyword=conjunto+moletom+minnie+infantil"
        },
        {
          id: 4,
          name: "Kit com 2 Tênis Infantil Menina Conforto",
          image: "/images/Eloa presentes/Kit 2 Tenis Infantil Menina.webp",
          status: "Disponível",
          shopeeUrl: "https://shopee.com.br/search?keyword=kit+2+tenis+infantil+menina"
        },
        {
          id: 5,
          name: "Kit 6 Peças Conjunto Moletom Menina",
          image: "/images/Eloa presentes/Kit 6 Peças Conjunto Moletom Infantil Menina.webp",
          status: "Disponível",
          shopeeUrl: "https://shopee.com.br/search?keyword=kit+6+pecas+moletom+infantil+menina"
        },
        {
          id: 6,
          name: "Maleta Médica de Brinquedo Infantil",
          image: "/images/Eloa presentes/Maleta medica.webp",
          status: "Disponível",
          shopeeUrl: "https://shopee.com.br/search?keyword=maleta+medica+brinquedo+infantil"
        },
        {
          id: 7,
          name: "Tênis Calçado Infantil Feminino com Led",
          image: "/images/Eloa presentes/Tenis Calçado Sapato Infantil Feminino com luz.webp",
          status: "Disponível",
          shopeeUrl: "https://shopee.com.br/search?keyword=tenis+infantil+feminino+com+luz"
        },
        {
          id: 8,
          name: "Tênis Esportivo Infantil para Corrida",
          image: "/images/Eloa presentes/Tenis para criança malha de couro corrida esportiva.png",
          status: "Disponível",
          shopeeUrl: "https://shopee.com.br/search?keyword=tenis+infantil+menina+corrida"
        },
        {
          id: 9,
          name: "Conjunto Moletom Agasalho de Inverno",
          image: "/images/Eloa presentes/Conjunto infantil feminino de inverno agasalho menina.webp",
          status: "Disponível",
          shopeeUrl: "https://shopee.com.br/search?keyword=conjunto+infantil+feminino+de+inverno"
        }
      ];
      updateGiftsStateAndSave(defaultGifts);
    }
  };

  // --- HANDLERS FOR MURAL MESSAGE ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallName.trim() || !wallText.trim()) return;

    const newMessage: WallMessage = {
      id: Date.now(),
      name: wallName.trim(),
      text: wallText.trim(),
      date: new Date().toLocaleDateString('pt-BR')
    };

    const currentName = wallName.trim();
    const currentText = wallText.trim();
    setLastSentMessage({ name: currentName, text: currentText });

    // Keep it local as immediate UI preview
    setMessages(prev => {
      const updated = [newMessage, ...prev];
      localStorage.setItem('eloa_messages_v3', JSON.stringify(updated));
      return updated;
    });

    setWallName('');
    setWallText('');
    setMessageSubmitted(true);
    setTimeout(() => setMessageSubmitted(false), 8000); // Allow longer timeout for the WhatsApp CTA link in the message alert

    // Persist to database in realtime/public
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMessage.name,
          text: newMessage.text,
          date: newMessage.date
        })
      });

      if (response.ok) {
        const savedDbMsg = await response.json();
        if (savedDbMsg && savedDbMsg.id) {
          // Replace the temporary local message ID with the actual database ID for consistency
          setMessages(prev => 
            prev.map(m => m.id === newMessage.id ? { ...m, id: Number(savedDbMsg.id) } : m)
          );
        }
      } else {
        console.error("Failed to save message to database API:", response.statusText);
      }
    } catch (err) {
      console.error("Failed to post message to database:", err);
    }

    // Trigger automated WhatsApp sharing of the message
    const waText = `Olá! Deixei uma mensagem no Mural de Bênçãos para a Princesa Eloá! ✨\n\nMensagem: "${currentText}"\n— Enviada por: *${currentName}*`;
    const waUrl = `https://wa.me/5511951605888?text=${encodeURIComponent(waText)}`;
    
    try {
      window.open(waUrl, '_blank');
    } catch (winErr) {
      console.error("Popup blocker prevented WhatsApp redirect", winErr);
    }
  };

  // --- LIGHTBOX INTERACTIVE COMPONENT NAVIGATION ---
  const handlePrevImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => {
      if (prev === null) return null;
      return prev === 0 ? filteredGallery.length - 1 : prev - 1;
    });
  };

  const handleNextImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => {
      if (prev === null) return null;
      return prev === filteredGallery.length - 1 ? 0 : prev + 1;
    });
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-cormorant select-none bg-[#F7F3EE]">

      {/* --- BACKGROUND INTERATIVO PREMIUM (ORQUÍDEAS E PARTÍCULAS DOURADAS REATIVAS AO MOUSE) --- */}
      <InteractiveEnchantedBackground />

      {/* --- AMBIENT SOUND CONTROLLER WIDGET (LUXURY INTERACTIVE AUDIO DOCK) --- */}
      {isOpened && (
        <div 
          id="sound-control-panel"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white/90 backdrop-blur-md p-3 px-4 rounded-2xl border border-[#C8A45A]/40 shadow-[0_10px_30px_rgba(90,45,130,0.15)] select-none transition-all duration-500 hover:border-[#C8A45A]"
        >
          {/* Waveform indicator */}
          <div className="flex items-end gap-0.5 h-6 w-5 px-1">
            <span className={`w-0.5 bg-[#5A2D82] rounded-full transition-all duration-300 ${isPlayingAudio ? 'animate-[wave_1s_infinite_ease-in-out]' : 'h-1.5'}`} style={{ height: isPlayingAudio ? undefined : '6px', animationDelay: '0.1s' }}></span>
            <span className={`w-0.5 bg-[#C8A45A] rounded-full transition-all duration-300 ${isPlayingAudio ? 'animate-[wave_0.8s_infinite_ease-in-out]' : 'h-2.5'}`} style={{ height: isPlayingAudio ? undefined : '10px', animationDelay: '0.3s' }}></span>
            <span className={`w-0.5 bg-[#A04BC7] rounded-full transition-all duration-300 ${isPlayingAudio ? 'animate-[wave_1.2s_infinite_ease-in-out]' : 'h-1'}`} style={{ height: isPlayingAudio ? undefined : '4px', animationDelay: '0.5s' }}></span>
          </div>

          <style jsx>{`
            @keyframes wave {
              0%, 100% { height: 4px; }
              50% { height: 18px; }
            }
          `}</style>

          {/* Song info / Playback selector */}
          <div className="flex flex-col text-left max-w-[120px] sm:max-w-[180px]">
            <span className="text-[9px] uppercase tracking-widest font-semibold text-[#C8A45A]">Som do Reino</span>
            <span className="text-xs font-medium text-[#5A2D82] truncate font-sans">{PLAYLIST[currentTrackIndex].title}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 border-l border-[#EFE7DB] pl-2.5 ml-1">
            {/* Skip track button */}
            <button
              onClick={nextTrack}
              className="p-1 rounded-lg hover:bg-[#EFE7DB]/60 text-[#A04BC7] transition-all"
              title="Próxima Melodia"
              aria-label="Proxima canção"
            >
              <Compass className="h-4 w-4 animate-spin-slow text-[#C8A45A]" style={{ animationDuration: '30s' }} />
            </button>

            {/* Volume toggle */}
            <button
              onClick={() => changeVolume(audioVolume === 0 ? 0.25 : audioVolume === 0.25 ? 0.55 : 0)}
              className="p-1 rounded-lg hover:bg-[#EFE7DB]/60 text-gray-600 transition-all"
              title={`Ajustar Volume (Atual: ${Math.round(audioVolume * 100)}%)`}
              aria-label="Ajustar Volume"
            >
              {audioVolume === 0 ? (
                <VolumeX className="h-4 w-4 text-gray-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-[#5A2D82]" style={{ opacity: audioVolume > 0.4 ? 1 : 0.6 }} />
              )}
            </button>

            {/* Play / Pause Primary Button */}
            <button 
              onClick={togglePlayAudio}
              className="p-2 rounded-full bg-[#5A2D82] hover:bg-[#A04BC7] text-[#E7D5B5] shadow-md transition-all duration-300 scale-105 active:scale-95"
              title={isPlayingAudio ? "Pausar Orquestra" : "Tocar Orquestra"}
              aria-label="Tocar canção"
            >
              {isPlayingAudio ? (
                <span className="block w-2.5 h-2.5 flex justify-center items-center gap-0.5">
                  <span className="w-0.75 h-2.5 bg-[#E7D5B5] inline-block rounded-sm"></span>
                  <span className="w-0.75 h-2.5 bg-[#E7D5B5] inline-block rounded-sm"></span>
                </span>
              ) : (
                <svg className="w-2.5 h-2.5 fill-current text-[#E7D5B5] translate-x-px" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* --- EXPERIÊNCIA DE ABERTURA (ENVELOPE REAL DE LUXO) --- */}
      <AnimatePresence>
        {!isOpened && (
          <motion.div
            id="envelope-screen"
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 1.2, ease: "easeInOut" } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#5A2D82] overflow-hidden p-4"
          >
            {/* Elegant Royal Damask Background Accent */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F7F3EE_1.5px,transparent_1.5px)] [background-size:32px_32px]"></div>
            
            {/* Soft gold particles drifting on royal screen */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <div className="absolute w-12 h-12 bg-radial from-[#D4AF37] via-transparent to-transparent opacity-80 top-1/4 left-1/3 animate-ping"></div>
              <div className="absolute w-16 h-16 bg-radial from-[#D4AF37] via-transparent to-transparent opacity-60 top-3/4 left-2/3 animate-ping [animation-delay:2s]"></div>
            </div>

            {/* Simulated Envelope Structure */}
            <div className="relative w-full max-w-lg lg:max-w-xl mx-auto flex flex-col items-center">
              
              {/* Outer Invitation Card with Monogram E */}
              <motion.div 
                animate={isOpening ? { y: -100, rotateX: 25, scale: 0.9, opacity: 0 } : { y: 0, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="w-full bg-[#EFE7DB] rounded-2xl shadow-2xl overflow-hidden gold-foil-border p-8 text-center relative z-20 flex flex-col items-center justify-center space-y-6"
                id="invitation-outer-card"
              >
                {/* Deluxe Corner Ornaments */}
                <span className="absolute top-4 left-4 text-xs font-mono tracking-widest text-[#C8A45A]">❦</span>
                <span className="absolute top-4 right-4 text-xs font-mono tracking-widest text-[#C8A45A]">❦</span>
                <span className="absolute bottom-4 left-4 text-xs font-mono tracking-widest text-[#C8A45A]">❦</span>
                <span className="absolute bottom-4 right-4 text-xs font-mono tracking-widest text-[#C8A45A]">❦</span>

                {/* Elegant Rounded Logo Wrapper */}
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-[#C8A45A] shadow-inner flex items-center justify-center overflow-hidden animate-pulse bg-[#5A2D82]" id="welcome-royal-monogram-container">
                  <Image 
                    src="/images/royal_monogram_e.png" 
                    alt="Monograma Imperial E" 
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover rounded-full"
                    id="welcome-royal-monogram"
                  />
                </div>

                <div className="space-y-3">
                  <h2 className="font-cinzel text-lg sm:text-2xl text-[#5A2D82] font-semibold tracking-widest">
                    REINO ENCANTADO
                  </h2>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#C8A45A] to-transparent mx-auto"></div>
                  <p className="font-cormorant text-[#C8A45A] font-medium text-xs sm:text-sm tracking-[0.25em] uppercase">
                    5 Anos de Amor e Luz
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="font-cormorant text-md sm:text-xl text-[#5A2D82] leading-relaxed italic max-w-md">
                    {"\"Um Reino Encantado para Celebrar os 5 Anos da Princesa Eloá\""}
                  </p>
                  <p className="font-cormorant text-xs text-[#A04BC7] tracking-wider uppercase font-semibold">
                    13 de Junho de 2026 • 16:00h
                  </p>
                </div>

                {/* Opening Trigger Wax Seal Button */}
                <button
                  id="abrir-convite-btn"
                  onClick={triggerOpening}
                  disabled={isOpening}
                  className="relative group mt-4 px-8 py-3 bg-gradient-to-r from-[#5A2D82] to-[#A04BC7] text-[#F7F3EE] rounded-full font-cinzel text-sm uppercase tracking-widest border border-[#D4AF37] hover:border-[#F7F3EE] hover:bg-gradient-to-r hover:from-[#A04BC7] hover:to-[#5A2D82] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-500 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <Sparkles className="h-4 w-4 text-[#D4AF37] group-hover:rotate-12 transition-transform duration-300" />
                    <span>{isOpening ? "Abrindo Portal..." : "ABRIR CONVITE"}</span>
                    <Sparkles className="h-4 w-4 text-[#D4AF37] group-hover:rotate-12 transition-transform duration-300" />
                  </span>
                  <span className="absolute inset-0 w-0 bg-white/10 group-hover:w-full transition-all duration-300 ease-out"></span>
                </button>
              </motion.div>

              {/* Behind Envelope Shadow Board */}
              <div className="absolute inset-0 bg-black/30 blur-2xl -z-10 rounded-2xl"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>





      {/* --- CORE CONTENT POST ENVELOPE ACTIVATION --- */}
      {isOpened && (
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="relative bg-[#F7F3EE] min-h-screen"
        >
          {/* Theme elements from "Sleek Interface" */}
          <div className="bg-pattern absolute inset-0 pointer-events-none"></div>
          <div className="sleek-frame-border hidden xl:block pointer-events-none"></div>

          {/* --- SEÇÃO HERO --- */}
          <section id="welcome" className="relative py-16 sm:py-24 px-4 bg-gradient-to-b from-[#F7F3EE] via-[#E7D5B5]/20 to-[#F7F3EE] overflow-hidden flex flex-col items-center text-center">
            {/* Elegant Floral background curves */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#A04BC7]/5 to-transparent rounded-full -z-10"></div>
            <div className="absolute bottom-12 left-0 w-72 h-72 bg-radial from-[#C8A45A]/5 to-transparent rounded-full -z-10"></div>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 1.2, ease: "easeOut" }}
              className="max-w-3xl mx-auto space-y-8 relative z-10"
            >
              {/* Gold Crown Silhouette SVG */}
              <div className="flex justify-center mb-2">
                <svg className="w-12 h-10 text-[#C8A45A] animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2.5 12h19l-2-7-4.5 4.5L12 3l-3 6.5L4.5 5l-2 7z" fill="currentColor" opacity="0.15" />
                  <path d="M2.5 12h19v3a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2v-3z" fill="currentColor" opacity="0.15" />
                  <path d="M5 21h14" strokeLinecap="round" />
                  <path d="M2.5 12l1.5-6.5L8.5 10l3.5-7 3.5 7 4.5-4.5 1.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Title Header */}
              <div className="space-y-2">
                <p className="font-cormorant text-xs uppercase tracking-[0.3em] text-[#C8A45A] font-semibold">
                  Solenidade de Aniversário
                </p>
                <h1 className="font-cinzel text-4xl sm:text-6xl md:text-7xl font-bold tracking-widest text-[#5A2D82]" id="hero-title">
                  PRINCESA ELOÁ
                </h1>
                
                {/* Sleek Design Ornament Splitter */}
                <div className="sleek-ornament"></div>

                <p className="font-cormorant font-medium text-lg sm:text-2xl text-[#C8A45A] tracking-wider italic">
                  {"\"Convida você para celebrar seus 5 anos de vida.\""}
                </p>
              </div>

              {/* Ornate Golden-Framed Portrait */}
              <div className="relative mx-auto my-8 max-w-sm" id="hero-portrait-container">
                {/* Floating Orchid Vector Overlay absolute top left */}
                <div className="absolute -top-6 -left-6 z-20 w-16 h-16 pointer-events-none drop-shadow-xl animate-pulse">
                  <svg viewBox="0 0 100 100" className="text-[#A04BC7] w-full h-full fill-current">
                    <path d="M50,20 C55,10 65,10 70,20 C75,30 65,40 50,55 C35,40 25,30 30,20 C35,10 45,10 50,20 Z" />
                    <path d="M50,55 C45,65 35,75 30,80 C25,85 30,90 40,85 C50,80 50,70 50,55 Z" opacity="0.8" />
                    <path d="M50,55 C55,65 65,75 70,80 C75,85 70,90 60,85 C50,80 50,70 50,55 Z" opacity="0.8" />
                    <circle cx="50" cy="40" r="6" fill="#D4AF37" />
                  </svg>
                </div>

                {/* Floating Orchid Vector Overlay absolute bottom right */}
                <div className="absolute -bottom-6 -right-6 z-20 w-16 h-16 pointer-events-none drop-shadow-xl">
                  <svg viewBox="0 0 100 100" className="text-[#A04BC7] w-full h-full fill-current">
                    <path d="M50,20 C55,10 65,10 70,20 C75,30 65,40 50,55 C35,40 25,30 30,20 C35,10 45,10 50,20 Z" opacity="0.9" />
                    <circle cx="50" cy="40" r="6" fill="#D4AF37" />
                  </svg>
                </div>

                {/* Main Photo with Gold Carved Baroque Border Layout */}
                <div className="p-2 bg-white rounded-lg shadow-2xl border-8 border-white outline outline-1 outline-[#C8A45A] overflow-hidden group relative">
                  <div className="relative aspect-[3/4] w-full rounded overflow-hidden border border-[#E7D5B5]">
                    <Image
                      src="/images/princess_eloa_hero.png"
                      alt="Princesa Eloá em seu retrato real"
                      fill
                      priority
                      referrerPolicy="no-referrer"
                      className="object-cover transform group-hover:scale-105 transition-transform duration-[4000ms]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#5A2D82]/30 to-transparent"></div>
                  </div>
                </div>

                {/* Luxury Label */}
                <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-[#5A2D82] text-[#F7F3EE] px-6 py-2 border border-[#D4AF37] rounded-full text-xs font-cinzel tracking-widest shadow-lg z-10 whitespace-nowrap">
                  PRINCESA ELOÁ
                </div>
              </div>

              {/* Event Date badge */}
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#A04BC7]">Data da Reunião de Gala</span>
                <p className="font-cinzel text-2xl sm:text-3xl font-bold text-[#5A2D82]">
                  SÁBADO, 13 DE JUNHO DE 2026
                </p>
                <p className="font-cormorant text-md text-[#C8A45A] tracking-wider uppercase font-medium">
                  Às 16 Horas de Brasília
                </p>
              </div>

              {/* Countdown counter */}
              <div className="pt-6" id="countdown-area">
                <h3 className="font-cormorant text-xs uppercase tracking-[0.25em] text-[#C8A45A] font-semibold mb-3">
                  CONTAGEM REGRESSIVA PARA O REINO ENCANTADO
                </h3>

                {timeLeft.completed ? (
                  <div className="font-cinzel text-xl text-[#A04BC7] font-semibold bg-white px-8 py-4 rounded-xl border border-[#D4AF37] inline-block shadow-lg">
                    ✨ O Grande Dia Real Chegou! ✨
                  </div>
                ) : (
                  <div className="flex flex-row justify-center items-center gap-2 sm:gap-4">
                    {/* Days indicator */}
                    <div className="bg-white/90 rounded-2xl w-16 h-18 sm:w-24 sm:h-24 shadow-md border-b-[3px] border-[#C8A45A] flex flex-col justify-center items-center">
                      <span className="font-cinzel text-xl sm:text-3xl font-bold text-[#5A2D82]">{timeLeft.days}</span>
                      <span className="font-cormorant text-[10px] sm:text-xs uppercase tracking-widest text-[#C8A45A]">Dias</span>
                    </div>

                    <span className="font-cinzel text-lg sm:text-2xl text-[#C8A45A]">:</span>

                    {/* Hours indicator */}
                    <div className="bg-white/90 rounded-2xl w-16 h-18 sm:w-24 sm:h-24 shadow-md border-b-[3px] border-[#C8A45A] flex flex-col justify-center items-center">
                      <span className="font-cinzel text-xl sm:text-3xl font-bold text-[#5A2D82]">{timeLeft.hours}</span>
                      <span className="font-cormorant text-[10px] sm:text-xs uppercase tracking-widest text-[#C8A45A]">Horas</span>
                    </div>

                    <span className="font-cinzel text-lg sm:text-2xl text-[#C8A45A]">:</span>

                    {/* Minutes indicator */}
                    <div className="bg-white/90 rounded-2xl w-16 h-18 sm:w-24 sm:h-24 shadow-md border-b-[3px] border-[#C8A45A] flex flex-col justify-center items-center">
                      <span className="font-cinzel text-xl sm:text-3xl font-bold text-[#5A2D82]">{timeLeft.minutes}</span>
                      <span className="font-cormorant text-[10px] sm:text-xs uppercase tracking-widest text-[#C8A45A]">Min</span>
                    </div>

                    <span className="font-cinzel text-lg sm:text-2xl text-[#C8A45A]">:</span>

                    {/* Seconds indicator */}
                    <div className="bg-white/90 rounded-2xl w-16 h-18 sm:w-24 sm:h-24 shadow-md border-b-[3px] border-[#C8A45A] flex flex-col justify-center items-center">
                      <span className="font-cinzel text-xl sm:text-3xl font-bold text-[#5A2D82]">{timeLeft.seconds}</span>
                      <span className="font-cormorant text-[10px] sm:text-xs uppercase tracking-widest text-[#C8A45A]">Seg</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </section>


          {/* --- SEÇÃO DE BOAS-VINDAS --- */}
          <section className="py-20 px-4 bg-white relative overflow-hidden text-center" id="welcome-message">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md h-96 border border-[#E7D5B5]/20 rounded-full pointer-events-none -z-10"></div>
            
            <div className="max-w-xl mx-auto space-y-6">
              <span className="text-[#C8A45A] text-xl block">❧ ❦ ❧</span>
              
              <h2 className="font-cinzel text-2xl sm:text-3xl text-[#5A2D82] tracking-widest">
                BOAS-VINDAS REAL
              </h2>
              
              <div className="w-12 h-[1px] bg-[#C8A45A] mx-auto"></div>

              <p className="font-cormorant text-lg sm:text-2xl text-gray-700 leading-relaxed italic">
                {"\"Cada ano vivido traz histórias, descobertas e momentos inesquecíveis.\""}
              </p>
              
              <p className="font-cormorant text-md sm:text-xl text-gray-600 leading-relaxed">
                A Princesa Eloá está completando 5 anos e terá a alegria de compartilhar esta data tão especial ao lado das pessoas que fazem parte de sua história.
              </p>
              
              <p className="font-cormorant text-md sm:text-xl font-bold text-[#5A2D82] leading-relaxed">
                Sua presença tornará esta celebração ainda mais encantadora.
              </p>

              <div className="text-xl text-[#C8A45A] mt-4">❦</div>
            </div>
          </section>


          {/* --- SEÇÃO INFORMAÇÕES DO EVENTO (CARDS) --- */}
          <section id="event" className="py-20 px-4 bg-[#F7F3EE] relative">
            <div className="max-w-5xl mx-auto space-y-12">
              
              <div className="text-center space-y-2">
                <span className="text-xs uppercase tracking-[0.25em] text-[#C8A45A] font-semibold">Os Detalhes da Corte</span>
                <h2 className="font-cinzel text-3xl sm:text-4xl text-[#5A2D82] tracking-widest">
                  CRONOGRAMA DO EVENTO
                </h2>
                <div className="w-24 h-0.5 bg-[#C8A45A] mx-auto mt-2"></div>
              </div>

              {/* Grid 3 Cards Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* CARD 1: DATA E HORA */}
                <div className="bg-white rounded-r-2xl shadow-xl p-8 border-y border-r border-[#E7D5B5] border-l-4 border-l-[#C8A45A] relative overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="rounded-full bg-[#EFE7DB] h-12 w-12 flex items-center justify-center text-[#5A2D82] mb-6">
                    <Calendar className="h-6 w-6" />
                  </div>
                  
                  <h3 className="font-cinzel text-[#C8A45A] font-semibold text-sm uppercase tracking-widest mb-3">
                    Quando
                  </h3>
                  
                  <div className="space-y-2 font-cormorant text-gray-700 text-lg">
                    <p className="font-bold text-[#5A2D82]">Sábado, 13 de Junho de 2026</p>
                    <p>Recepção solene: <span className="font-bold">16h00</span></p>
                    <p className="text-sm italic text-gray-500">Pedimos pontualidade.</p>
                  </div>
                </div>

                {/* CARD 2: LOCAL DOS SONHOS */}
                <div className="bg-white rounded-r-2xl shadow-xl p-8 border-y border-r border-[#E7D5B5] border-l-4 border-l-[#C8A45A] relative overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="rounded-full bg-[#EFE7DB] h-12 w-12 flex items-center justify-center text-[#A04BC7] mb-6">
                    <MapPin className="h-6 w-6" />
                  </div>
                  
                  <h3 className="font-cinzel text-[#C8A45A] font-semibold text-sm uppercase tracking-widest mb-3">
                    Onde
                  </h3>
                  
                  <div className="space-y-2 font-cormorant text-gray-700 text-lg">
                    <p className="font-bold text-[#5A2D82]">Castelo Encantado Vila Roschel</p>
                    <p>Rua Paralela, nº 275</p>
                    <p>Vila Roschel, São Paulo</p>
                  </div>
                </div>

                {/* CARD 3: TRAJE RECOMENDADO */}
                <div className="bg-white rounded-r-2xl shadow-xl p-8 border-y border-r border-[#E7D5B5] border-l-4 border-l-[#C8A45A] relative overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="rounded-full bg-[#EFE7DB] h-12 w-12 flex items-center justify-center text-[#C8A45A] mb-6">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  
                  <h3 className="font-cinzel text-[#C8A45A] font-semibold text-sm uppercase tracking-widest mb-3">
                    Dress Code
                  </h3>
                  
                  <div className="space-y-2 font-cormorant text-gray-700 text-lg text-left">
                    <p className="font-semibold text-[#5A2D82]">Social leve ou Esporte fino</p>
                    <p className="text-sm">Os Tons sugeridos do Reino são:</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-pink-100 border border-pink-300" title="Rosa"></div>
                      <span className="text-xs">Rosa</span>
                      
                      <div className="w-5 h-5 rounded-full bg-purple-100 border border-purple-300" title="Lilás"></div>
                      <span className="text-xs">Lilás</span>
                      
                      <div className="w-5 h-5 rounded-full bg-white border border-gray-300" title="Branco"></div>
                      <span className="text-xs">Branco</span>
                    </div>
                    <p className="text-xs italic text-gray-500 pt-1">Participação nos tons é opcional.</p>
                  </div>
                </div>

              </div>

            </div>
          </section>


          {/* --- SEÇÃO MAPA --- */}
          <section className="py-16 px-4 bg-white relative">
            <div className="max-w-4xl mx-auto space-y-8 text-center">
              
              <div className="space-y-2">
                <Compass className="h-8 w-8 text-[#C8A45A] mx-auto animate-spin-slow" />
                <h3 className="font-cinzel text-xl text-[#5A2D82] tracking-wider uppercase">Mapa de Direção ao Reino</h3>
                <p className="font-cormorant text-gray-600">Localize e trace sua rota para o Palácio de comemoração.</p>
              </div>

              {/* Embedded Interactive Google Maps Iframe */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-[#C8A45A] aspect-video w-full relative">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d116744.75549071068!2d-46.77254559!3d-23.75402434!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce4be2368dcbf3%3A0xc4f5c94132b90ffb!2sVila%20Roschel%2C%20S%C3%A3o%20Paulo%20-%20SP!5e0!3m2!1spt-BR!2sbr!4v1717900000000!5m2!1spt-BR!2sbr" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer"
                  className="absolute inset-0"
                  title="Localização do Salão Real no Google Maps"
                ></iframe>
              </div>

              {/* Premium COMO CHEGAR navigation button */}
              <div className="pt-2">
                <a 
                  id="como-chegar-btn"
                  href="https://www.google.com/maps/dir/?api=1&destination=Rua+Paralela+275+Vila+Roschel+Sao+Paulo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-3 px-8 py-3.5 bg-gradient-to-r from-[#C8A45A] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#C8A45A] text-white rounded-full font-cinzel text-xs sm:text-sm uppercase tracking-widest shadow-lg hover:shadow-xl active:scale-95 transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  <MapPin className="h-4 w-4" />
                  <span>COMO CHEGAR (ABRIR NAVEGADOR)</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

            </div>
          </section>


          {/* --- SEÇÃO PROGRAMAÇÃO TIMELINE --- */}
          <section className="py-20 px-4 bg-[#F7F3EE] relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C8A45A] to-transparent"></div>
            
            <div className="max-w-3xl mx-auto space-y-12">
              
              <div className="text-center space-y-2">
                <span className="text-xs uppercase tracking-[0.25em] text-[#C8A45A] font-semibold">O Protocolo de Celebração</span>
                <h2 className="font-cinzel text-3xl text-[#5A2D82] tracking-widest">
                  PROGRAMAÇÃO REAL
                </h2>
                <div className="w-16 h-0.5 bg-[#C8A45A] mx-auto mt-2"></div>
              </div>

              {/* Timeline Container */}
              <div className="relative border-l-2 border-[#C8A45A] ml-4 sm:ml-32 space-y-12 py-4">
                
                {/* TIMELINE POINT 1 */}
                <div className="relative pl-8 sm:pl-12">
                  <div className="absolute -left-2.5 top-1.5 bg-[#D4AF37] rounded-full h-5 w-5 border-4 border-[#F7F3EE] shadow-md"></div>
                  
                  {/* Floating Time Label for bigger screens */}
                  <div className="hidden sm:block absolute -left-32 top-1 w-24 text-right">
                    <span className="font-cinzel font-bold text-[#5A2D82] text-lg">16h00</span>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6 border border-[#E7D5B5]/60">
                    <span className="inline-block sm:hidden font-cinzel font-bold text-sm text-[#A04BC7] uppercase tracking-wider mb-1">
                      16h00
                    </span>
                    <h4 className="font-cinzel text-[#5A2D82] font-semibold text-lg uppercase">
                      Recepção dos Convidados
                    </h4>
                    <p className="font-cormorant text-gray-600 text-md mt-1">
                      Abertura dos portais do reino com música e acolhida dos convidados da Princesa Eloá.
                    </p>
                  </div>
                </div>

                {/* TIMELINE POINT 2 */}
                <div className="relative pl-8 sm:pl-12">
                  <div className="absolute -left-2.5 top-1.5 bg-[#5A2D82] rounded-full h-5 w-5 border-4 border-[#F7F3EE] shadow-md"></div>
                  
                  {/* Floating Time Label for bigger screens */}
                  <div className="hidden sm:block absolute -left-32 top-1 w-24 text-right">
                    <span className="font-cinzel font-bold text-[#5A2D82] text-lg">16h30</span>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6 border border-[#E7D5B5]/60">
                    <span className="inline-block sm:hidden font-cinzel font-bold text-sm text-[#A04BC7] uppercase tracking-wider mb-1">
                      16h30
                    </span>
                    <h4 className="font-cinzel text-[#5A2D82] font-semibold text-lg uppercase">
                      Banquete da Corte
                    </h4>
                    <p className="font-cormorant text-gray-600 text-md mt-1">
                      Abertura das ilhas gastronômicas. Não forneceremos bebidas alcoólicas, pedimos que tragam sua bebida e 1klg de carne para contribuir.
                    </p>
                  </div>
                </div>

                {/* TIMELINE POINT 3 */}
                <div className="relative pl-8 sm:pl-12">
                  <div className="absolute -left-2.5 top-1.5 bg-[#A04BC7] rounded-full h-5 w-5 border-4 border-[#F7F3EE] shadow-md"></div>
                  
                  {/* Floating Time Label for bigger screens */}
                  <div className="hidden sm:block absolute -left-32 top-1 w-24 text-right">
                    <span className="font-cinzel font-bold text-[#5A2D82] text-lg">18h30</span>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6 border border-[#E7D5B5]/60">
                    <span className="inline-block sm:hidden font-cinzel font-bold text-sm text-[#A04BC7] uppercase tracking-wider mb-1">
                      18h30
                    </span>
                    <h4 className="font-cinzel text-[#5A2D82] font-semibold text-lg uppercase">
                      Coraçao Doce: Parabéns Real
                    </h4>
                    <p className="font-cormorant text-gray-600 text-md mt-1">
                      Reuniremos nossa corte em torno do bolo imperial de 5 anos para cantar as felicitações à Princesa Eloá.
                    </p>
                  </div>
                </div>

                {/* TIMELINE POINT 4 */}
                <div className="relative pl-8 sm:pl-12">
                  <div className="absolute -left-2.5 top-1.5 bg-[#C8A45A] rounded-full h-5 w-5 border-4 border-[#F7F3EE] shadow-md"></div>
                  
                  {/* Floating Time Label for bigger screens */}
                  <div className="hidden sm:block absolute -left-32 top-1 w-24 text-right">
                    <span className="font-cinzel font-bold text-[#5A2D82] text-xs uppercase tracking-widest">Solenidade</span>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6 border border-[#E7D5B5]/60">
                    <span className="inline-block sm:hidden font-cinzel font-bold text-sm text-[#A04BC7] uppercase tracking-wider mb-1">
                      Toda a Festa
                    </span>
                    <h4 className="font-cinzel text-[#5A2D82] font-semibold text-lg uppercase">
                      Música, Alegria & Diversão
                    </h4>
                    <p className="font-cormorant text-gray-600 text-md mt-1">
                      Comemoração repleta de muita música, dança e alegria ao longo de todo o evento. E logo após a festa, continuaremos na torcida vibrante com a transmissão do jogo do Brasil da Copa do Mundo!
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </section>


          {/* --- SEÇÃO GALERIA --- */}
          <section id="gallery" className="py-20 px-4 bg-white relative">
            <div className="max-w-6xl mx-auto space-y-10">
              
              <div className="text-center space-y-2">
                <span className="text-xs uppercase tracking-[0.25em] text-[#C8A45A] font-semibold">Registros de Amor</span>
                <h2 className="font-cinzel text-3xl sm:text-4xl text-[#5A2D82] tracking-widest">
                  GALERIA DE MEMÓRIAS
                </h2>
                <div className="w-24 h-0.5 bg-[#C8A45A] mx-auto mt-2"></div>
              </div>

              {/* Responsive Category Selector */}
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto" id="gallery-categories">
                {galleryCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-5 py-2 rounded-full font-cinzel text-xs uppercase tracking-widest transition-all duration-300 ${
                      activeCategory === cat.id
                        ? 'bg-[#5A2D82] text-[#F7F3EE] border border-[#D4AF37] shadow-md'
                        : 'bg-[#F7F3EE] text-[#5A2D82] border border-[#E7D5B5] hover:bg-[#EFE7DB]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Gallery Grid Output */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="gallery-grid">
                {filteredGallery.map((img, idx) => (
                  <div 
                    key={img.id}
                    onClick={() => setLightboxIndex(idx)}
                    className="group relative aspect-[3/4] cursor-pointer rounded-2xl overflow-hidden border border-[#E7D5B5] shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <Image
                      src={img.src}
                      alt={img.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      referrerPolicy="no-referrer"
                      className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Shadow Layer overlay and text with icon */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div className="text-white text-left">
                        <span className="font-cinzel text-[10px] uppercase tracking-widest text-[#D4AF37] block">
                          Ampliar Foto
                        </span>
                        <p className="font-cormorant font-semibold text-sm sm:text-md truncate">
                          {img.title}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>


          {/* --- LIGHTBOX MODAL CONTAINER --- */}
          <AnimatePresence>
            {lightboxIndex !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4"
              >
                {/* Close Button element */}
                <button 
                  onClick={() => setLightboxIndex(null)}
                  className="absolute top-6 right-6 text-[#F7F3EE] hover:text-[#D4AF37] transition-colors p-2"
                >
                  <X className="h-8 w-8" />
                </button>

                {/* Left navigation arrow */}
                <button 
                  onClick={handlePrevImage}
                  className="absolute left-4 p-2 text-[#F7F3EE] hover:text-[#D4AF37] transition-colors focus:outline-none"
                >
                  <ChevronLeft className="h-10 w-10 sm:h-12 sm:w-12" />
                </button>

                {/* Active Enlarged Image view */}
                <div className="relative w-full max-w-3xl aspect-[3/4] max-h-[80vh] flex items-center justify-center">
                  <Image
                    src={filteredGallery[lightboxIndex].src}
                    alt={filteredGallery[lightboxIndex].title}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-contain"
                  />
                </div>

                {/* Caption labels */}
                <div className="mt-4 text-center text-white space-y-1">
                  <span className="font-cinzel text-xs uppercase tracking-widest text-[#D4AF37]">
                    {lightboxIndex + 1} / {filteredGallery.length}
                  </span>
                  <p className="font-cormorant text-lg sm:text-2xl font-bold italic">
                    {filteredGallery[lightboxIndex].title}
                  </p>
                </div>

                {/* Right navigation arrow */}
                <button 
                  onClick={handleNextImage}
                  className="absolute right-4 p-2 text-[#F7F3EE] hover:text-[#D4AF37] transition-colors focus:outline-none"
                >
                  <ChevronRight className="h-10 w-10 sm:h-12 sm:w-12" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>


          {/* --- SEÇÃO PRESENTES --- */}
          <section id="gifts" className="py-20 px-4 bg-[#F7F3EE] relative">
            <div className="max-w-5xl mx-auto space-y-12">
              
              <div className="text-center space-y-2">
                <Gift className="h-8 w-8 text-[#C8A45A] mx-auto animate-pulse" />
                <span className="text-xs uppercase tracking-[0.25em] text-[#C8A45A] font-semibold">Tributo de Carinho</span>
                <h2 className="font-cinzel text-3xl text-[#5A2D82] tracking-widest">
                  LISTA DE PRESENTES SUGERIDA
                </h2>
                <div className="w-16 h-0.5 bg-[#C8A45A] mx-auto mt-2"></div>
                <div className="max-w-xl mx-auto pt-2">
                  <p className="font-cormorant text-xl text-[#5A2D82] italic font-semibold">
                    {"\"O maior presente será sua presença.\""}
                  </p>
                  <p className="font-cormorant text-md text-gray-500">
                    Caso deseje presentear a Princesa Eloá, disponibilizamos algumas sugestões abaixo.
                  </p>
                </div>
              </div>

              {/* Suggestions Grid list prepared for Supabase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="gifts-list">
                {gifts.map(item => (
                  <div 
                    key={item.id}
                    className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#E7D5B5] flex flex-col justify-between"
                  >
                    <div className="relative aspect-square w-full bg-gray-50 border-b border-gray-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 30vw"
                        referrerPolicy="no-referrer"
                        className="object-cover p-2"
                      />
                      <span className={`absolute top-4 right-4 px-3 py-1 text-[10px] font-cinzel rounded-full uppercase tracking-wider z-10 border ${
                        item.status === 'Disponível'
                          ? 'bg-green-50 text-green-700 border-green-300'
                          : item.status === 'Reservado'
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-red-50 text-red-700 border-red-300'
                      }`}>
                        {item.status} {item.reservedBy ? `por ${item.reservedBy}` : ''}
                      </span>
                    </div>

                    <div className="p-5 flex flex-col justify-between flex-grow space-y-4">
                      <div>
                        <h4 className="font-cinzel text-[#5A2D82] text-sm font-semibold tracking-wide h-10 overflow-hidden line-clamp-2">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-400 font-sans mt-1">Sugerido para Princesa Eloá</p>
                      </div>

                      <div className="flex gap-2">
                        {/* Interactive local reserve button */}
                        <button
                          onClick={() => openReserveModal(item)}
                          disabled={item.status !== 'Disponível'}
                          className={`flex-1 py-2 rounded-xl text-xs font-cinzel uppercase tracking-widest border transition-all ${
                            item.status === 'Disponível'
                              ? 'bg-white text-[#5A2D82] border-[#5A2D82] hover:bg-[#5A2D82] hover:text-white'
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          }`}
                        >
                          Reservar Presente
                        </button>

                        {/* Link to shooping portal */}
                        <a
                          href={item.shopeeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-4 py-2 bg-[#EE4D2D] text-white rounded-xl text-xs font-sans tracking-wide font-bold hover:opacity-90 transition-all"
                          title="Comprar Sugestão na Shopee"
                        >
                          Ver Shopee
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>


          {/* --- GIFT RESERVE MODAL DIALOG --- */}
          <AnimatePresence>
            {selectedGift && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-[#C8A45A] relative space-y-6"
                >
                  <button 
                    onClick={() => { setSelectedGift(null); setReserveName(''); }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="text-center space-y-1">
                    <span className="text-xs uppercase tracking-wider text-[#C8A45A] font-semibold">Reserva Real de Mimos</span>
                    <h3 className="font-cinzel text-lg text-[#5A2D82] font-semibold">RESERVAR SEU PRESENTE</h3>
                    <div className="w-12 h-0.5 bg-[#C8A45A] mx-auto mt-1"></div>
                  </div>

                  <div className="bg-[#F7F3EE] p-4 rounded-xl text-left border border-[#E7D5B5]/60">
                    <p className="text-xs text-gray-500 font-sans uppercase tracking-[0.1em]">Você escolheu o presente:</p>
                    <p className="font-cinzel text-sm text-[#5A2D82] font-semibold mt-1">{selectedGift.name}</p>
                  </div>

                  <form onSubmit={handleReserveGiftSubmit} className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-xs font-cinzel text-[#5A2D82] uppercase tracking-wider block">
                        Seu nome completo
                      </label>
                      <input 
                        type="text" 
                        required
                        value={reserveName}
                        onChange={(e) => setReserveName(e.target.value)}
                        placeholder="Ex: Titia Ana Carolina"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl font-cormorant text-md focus:outline-none focus:ring-1 focus:ring-[#5A2D82] focus:border-[#5A2D82] bg-white text-gray-800"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-[#5A2D82] to-[#A04BC7] text-white rounded-xl font-cinzel text-xs uppercase tracking-widest border border-[#D4AF37]"
                    >
                      Confirmar Reserva de Presente
                    </button>
                    <p className="text-xs text-center text-gray-400">
                      *Essa reserva é gerada localmente. O status mudará imediatamente.
                    </p>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* --- SEÇÃO PIX --- */}
          <section className="py-16 px-4 bg-white relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-8 text-center relative z-20">
              
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.25em] text-[#C8A45A] font-semibold">Praticidade Real</span>
                <h2 className="font-cinzel text-2xl sm:text-3xl text-[#5A2D82]">CONTRIBUIÇÃO VIA PIX</h2>
                <div className="w-16 h-0.5 bg-[#C8A45A] mx-auto"></div>
                <p className="font-cormorant text-gray-600 max-w-lg mx-auto text-lg pt-2 leading-relaxed">
                  {"\"Caso prefira, você também poderá contribuir através do Pix para ajudar na poupança dos sonhos da nossa princesinha.\""}
                </p>
              </div>

              {/* Pix Card */}
              <div className="bg-[#F7F3EE] rounded-2xl p-6 sm:p-8 shadow-inner border border-[#E7D5B5] space-y-4 max-w-md mx-auto relative group">
                <span className="absolute top-3 right-3 text-[#A04BC7] text-xs">✨ Pix Real ✨</span>
                
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="relative w-44 h-44 flex items-center justify-center text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/pix_qr.png"
                      alt="QR Code Pix"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.qr-fallback');
                          if (fallback) fallback.classList.remove('hidden');
                        }
                      }}
                    />
                    <div className="qr-fallback hidden absolute inset-0 flex flex-col items-center justify-center p-3 text-center border border-dashed border-[#C8A45A] rounded-xl bg-amber-50/10">
                      <QrCode className="h-10 w-10 text-[#C8A45A] mb-2 animate-pulse" />
                      <p className="text-[11px] font-sans text-gray-500 leading-normal">
                        Arraste e solte o seu QR Code <br />
                        do Pix na pasta <span className="font-mono font-semibold text-[#5A2D82]">public/images/</span> <br />
                        com o nome <span className="font-mono font-semibold text-[#5A2D82]">pix_qr.png</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-left space-y-1">
                  <span className="text-[10px] uppercase font-sans text-gray-400">Chave Pix (Celular):</span>
                  <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-between border border-gray-200 select-all">
                    <span className="font-sans font-medium text-sm text-gray-700 break-all">{pixKey}</span>
                  </div>
                </div>

                <div className="text-left space-y-0.5">
                  <span className="text-[10px] uppercase font-sans text-gray-400">Favorecido:</span>
                  <p className="font-cinzel text-[#5A2D82] text-xs font-semibold">{pixFavored}</p>
                </div>

                {/* Copiar Pix key button */}
                <button
                  id="copiar-pix-btn"
                  onClick={copyPixToClipboard}
                  className="w-full flex items-center justify-center space-x-3 py-3 bg-[#5A2D82] hover:bg-[#A04BC7] text-white rounded-xl font-cinzel text-xs uppercase tracking-widest shadow-md transition-colors duration-300"
                >
                  {copiedPix ? (
                    <>
                      <Check className="h-4 w-4 text-green-300 animate-bounce" />
                      <span className="text-green-200">CHAVE COPIADA!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-[#D4AF37]" />
                      <span>COPIAR CHAVE PIX</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </section>


          {/* --- SEÇÃO RSVP --- */}
          <section id="rsvp" className="py-20 px-4 bg-[#F7F3EE] relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C8A45A] to-transparent"></div>
            
            <div className="max-w-2xl mx-auto space-y-10 text-center">
              
              <div className="space-y-2">
                <UserCheck className="h-8 w-8 text-[#C8A45A] mx-auto" />
                <span className="text-xs uppercase tracking-[0.25em] text-[#C8A45A] font-semibold">Confirmação de Portaria</span>
                <h2 className="font-cinzel text-3xl text-[#5A2D82] tracking-widest">
                  CONFIRMAR PRESENÇA
                </h2>
                <div className="w-16 h-0.5 bg-[#C8A45A] mx-auto mt-2"></div>
                <p className="font-cormorant text-gray-600 max-w-lg mx-auto">
                  Por favor, insira o seu nome cadastrado na lista ou o seu código de convite para verificar seus acompanhantes autorizados pela organização da corte.
                </p>
              </div>

              {/* RSVP Core Panel with Simulated Search States */}
              <div className="bg-[#EFE7DB] rounded-2xl shadow-xl p-8 border border-[#C8A45A] relative text-left">

                <AnimatePresence mode="wait">
                  {/* STEP 1: GUEST IS SEARCHING */}
                  {!rsvpSearched && (
                    <motion.div
                      key="rsvp-search-state"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <form onSubmit={handleRsvpCheck} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-cinzel text-[#5A2D82] uppercase tracking-wider block">
                            NOME DO CONVIDADO PRINCIPAL / CÓDIGO DO CONVITE
                          </label>
                          <input 
                            id="rsvp-input-query"
                            type="text" 
                            required
                            value={rsvpQuery}
                            onChange={(e) => setRsvpQuery(e.target.value)}
                            placeholder="Digite seu nome completo..."
                            className="w-full px-4 py-3.5 border border-gray-300 rounded-xl font-cormorant text-md text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#5A2D82]"
                          />
                        </div>

                        <button
                          id="verificar-rsvp-btn"
                          type="submit"
                          disabled={submittingRsvp}
                          className="w-full py-4 bg-[#5A2D82] font-cinzel text-xs uppercase tracking-widest hover:bg-[#A04BC7] text-white rounded-xl border border-[#D4AF37] shadow-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          {submittingRsvp ? (
                            <span>Pesquisando nos Registros...</span>
                          ) : (
                            <>
                              <span>Verificar meu Convite</span>
                              <ArrowRight className="h-4 w-4 text-[#D4AF37]" />
                            </>
                          )}
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {/* STEP 2: SEARCH GUEST DONE */}
                  {rsvpSearched && !rsvpConfirmed && (
                    <motion.div
                      key="rsvp-result-state"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {rsvpGuest ? (
                        /* GUEST CORRECTLY RETRIEVED */
                        <div className="space-y-6">
                          <div className="p-5 bg-purple-50/50 rounded-xl border-l-4 border-[#A04BC7]">
                            <h4 className="font-cinzel text-md text-[#5A2D82] font-semibold">
                              Olá, {rsvpGuest.name}!
                            </h4>
                            <p className="font-cormorant text-md text-gray-700 mt-1">
                              Encontramos seu convite real. A listagem de convidados autorizados já está pré-definida pela organização.
                            </p>
                          </div>

                          <div className="space-y-4">
                            <h5 className="text-xs font-cinzel tracking-wider text-[#C8A45A]">COMPOSIÇÃO DOS AUTORIZADOS</h5>
                            
                            <div className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-[#E7D5B5]">
                              <UserPlus className="h-5 w-5 text-[#A04BC7]" />
                              <div>
                                <p className="font-sans font-bold text-sm text-[#5A2D82]">
                                  {rsvpGuest.companionsCount > 0 ? `Titular + ${rsvpGuest.companionsCount} Acompanhantes` : 'Apenas Entrada Individual'}
                                </p>
                                <p className="text-xs text-gray-400">Total autorizado por este convite</p>
                              </div>
                            </div>

                            {/* If there is an associated child or a responsible adult */}
                            {(rsvpGuest.responsibleAdult || rsvpGuest.associatedChild) && (
                              <div className="bg-amber-50/50 p-4 rounded-xl border border-dashed border-[#C8A45A]/40 text-left space-y-2">
                                <h6 className="text-[10px] uppercase tracking-wider text-[#5A2D82] font-bold font-sans">Vínculos Familiares</h6>
                                {rsvpGuest.responsibleAdult && (
                                  <div className="text-xs text-gray-700 font-sans flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#A04BC7]" />
                                    <span><strong className="text-[#5A2D82]">Adulto Responsável:</strong> {rsvpGuest.responsibleAdult}</span>
                                  </div>
                                )}
                                {rsvpGuest.associatedChild && (
                                  <div className="text-xs text-gray-700 font-sans flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#C8A45A]" />
                                    <span><strong className="text-[#5A2D82]">Criança Associada:</strong> {rsvpGuest.associatedChild}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Confirmation RSVP Button */}
                          <div className="flex gap-4">
                            <button
                              onClick={resetRsvp}
                              className="px-6 py-3 border border-gray-300 text-gray-500 rounded-xl text-xs font-cinzel uppercase tracking-wider hover:bg-gray-50 bg-white"
                            >
                              Voltar
                            </button>
                            <button
                              id="confirmar-presenca-final-btn"
                              onClick={handleRsvpConfirm}
                              disabled={submittingRsvp}
                              className="flex-1 py-3 bg-[#5A2D82] hover:bg-emerald-700 text-white font-cinzel text-xs uppercase tracking-widest rounded-xl border border-[#D4AF37] shadow-lg flex items-center justify-center space-x-2"
                            >
                              <span>{submittingRsvp ? 'Processando...' : 'CONFIRMAR PRESENÇA'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* GUEST FAILED SEARCH */
                        <div className="space-y-6 text-center py-4">
                          <div className="h-14 w-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto border border-red-300">
                            <X className="h-6 w-6" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-cinzel text-red-700 text-lg uppercase tracking-wider">
                              Convite Não Localizado
                            </h4>
                            <p className="font-cormorant text-[#5A2D82] text-lg leading-relaxed">
                              {"\"Convite não localizado. Entre em contato com a organização.\""}
                            </p>
                            <p className="text-xs text-gray-400 font-sans">
                              Verifique erros de grafia ou utilize parte do nome. Se o erro persistir, acesse o canal de mensagens da organização.
                            </p>
                          </div>

                          <button
                            onClick={resetRsvp}
                            className="w-full py-3 border border-[#C8A45A] text-[#5A2D82] rounded-xl font-cinzel text-xs uppercase tracking-widest hover:bg-[#EFE7DB] bg-white transition-colors"
                          >
                            Tentar Novamente
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 3: RSVP COMPLETED SUCCESS */}
                  {rsvpConfirmed && (
                    <motion.div
                      key="rsvp-success-state"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-6 py-6"
                    >
                      <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border-2 border-emerald-400 animate-bounce">
                        <Check className="h-8 w-8" />
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-cinzel text-emerald-800 text-xl tracking-wider">
                          PRESENÇA CONFIRMADA!
                        </h4>
                        <p className="font-cormorant text-gray-700 text-lg leading-relaxed max-w-sm mx-auto">
                          Sua confirmação foi anotada nos livros do Palácio. Estamos imensamente felizes em celebrar este reino com você.
                        </p>
                        {rsvpGuest && (
                          <div className="pt-2 flex flex-col items-center justify-center">
                            <a
                              href={`https://wa.me/5511951605888?text=${encodeURIComponent(
                                `Olá! Confirmo minha presença no aniversário da Princesa Eloá! 👑✨\n\nConvidado: *${rsvpGuest.name}*${rsvpGuest.code ? ` (Convite: ${rsvpGuest.code})` : ''}${rsvpGuest.companionsCount > 0 ? ` com +${rsvpGuest.companionsCount} acompanhante(s)` : ' (Entrada Individual)'}\nStatus: *Presença Confirmada!*`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#25D366] hover:bg-emerald-600 text-white rounded-xl font-cinzel text-xs uppercase tracking-widest shadow-md transition-colors w-full justify-center max-w-sm"
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span>Enviar via WhatsApp</span>
                            </a>
                          </div>
                        )}
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center space-y-2 inline-block mx-auto">
                          <QrCode className="h-24 w-24 text-gray-700" />
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">QR CODE DO CONVIDADO</p>
                        </div>
                        <p className="text-[10px] text-gray-400 font-sans italic">
                          Apresente este bilhete virtual / QR Code na recepção para sua validação.
                        </p>
                      </div>

                      <button
                        onClick={resetRsvp}
                        className="py-2.5 px-6 border border-gray-300 rounded-full font-cinzel text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-700"
                      >
                        Fazer Outra Confirmação
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

            </div>
          </section>


          {/* --- SEÇÃO MURAL DE MENSAGENS --- */}
          <section className="py-20 px-4 bg-white relative">
            <div className="max-w-4xl mx-auto space-y-12">
              
              <div className="text-center space-y-2">
                <MessageSquare className="h-8 w-8 text-[#C8A45A] mx-auto" />
                <span className="text-xs uppercase tracking-[0.25em] text-[#C8A45A] font-semibold">Templo de Afeto</span>
                <h2 className="font-cinzel text-3xl text-[#5A2D82] tracking-widest">
                  MURAL DE MENSAGENS REAL
                </h2>
                <div className="w-16 h-0.5 bg-[#C8A45A] mx-auto mt-2"></div>
                <p className="font-cormorant text-gray-600 max-w-md mx-auto">
                  Envie votos sinceros, bênçãos e orações para estampar o livro de memórias dos 5 anos da Princesa Eloá.
                </p>
              </div>

              {/* Grid 2 Columns: Message Form & Messages output */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* Submit Message form */}
                <div className="bg-[#F7F3EE] p-6 rounded-2xl border border-[#E7D5B5] space-y-4 text-left">
                  <h3 className="font-cinzel text-[#5A2D82] text-sm font-semibold uppercase tracking-wider">
                    Anote suas Bênçãos
                  </h3>

                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-cinzel text-[#5A2D82] uppercase tracking-wider block">
                        Seu nome / Família
                      </label>
                      <input 
                        type="text" 
                        required
                        value={wallName}
                        onChange={(e) => setWallName(e.target.value)}
                        placeholder="Ex: Titia Fabíola"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl font-cormorant text-md text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#5A2D82]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-cinzel text-[#5A2D82] uppercase tracking-wider block">
                        Mensagem de carinho
                      </label>
                      <textarea 
                        rows={4}
                        required
                        value={wallText}
                        onChange={(e) => setWallText(e.target.value)}
                        placeholder="Escreva seus votos doces à Princesa Eloá..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl font-cormorant text-md text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#5A2D82]"
                      ></textarea>
                    </div>

                    <button
                      id="enviar-mensagem-mural-btn"
                      type="submit"
                      className="w-full py-3.5 bg-[#5A2D82] hover:bg-[#A04BC7] text-white font-cinzel text-xs uppercase tracking-widest rounded-xl border border-[#D4AF37] flex items-center justify-center space-x-2 transition-colors duration-300 shadow-md"
                    >
                      <Send className="h-4 w-4 text-[#D4AF37]" />
                      <span>ENVIAR MENSAGEM</span>
                    </button>
                  </form>

                  <AnimatePresence>
                    {messageSubmitted && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 mt-2"
                      >
                        <div className="text-center text-xs text-green-700 bg-green-50 border border-green-200 py-2.5 rounded-xl block font-semibold">
                          Bênção depositada com sucesso e exposta no mural! ✨
                        </div>
                        {lastSentMessage && (
                          <div className="flex justify-center">
                            <a
                              href={`https://wa.me/5511951605888?text=${encodeURIComponent(
                                `Olá! Deixei uma mensagem no Mural de Bênçãos para a Princesa Eloá! ✨\n\nMensagem: "${lastSentMessage.text}"\n— Enviada por: *${lastSentMessage.name}*`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#25D366] hover:bg-emerald-600 text-white rounded-xl font-cinzel text-[10px] uppercase tracking-wider shadow-sm transition-colors w-full justify-center"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>Enviar também por WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Left Columns: Rendered Card Wall Messages list */}
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2" id="wall-messages-area">
                  {messages.length === 0 ? (
                    <div className="bg-white/40 backdrop-blur-xs p-8 rounded-2xl border border-dashed border-[#C8A45A]/40 text-center py-12 space-y-3">
                      <Heart className="h-8 w-8 text-[#C8A45A]/50 mx-auto animate-pulse" />
                      <p className="font-cinzel text-xs uppercase tracking-wider text-gray-400">Nenhuma bênção anotada ainda</p>
                      <p className="font-cormorant text-gray-500 text-lg italic max-w-sm mx-auto">
                        Seja o primeiro a enviar uma mensagem de carinho e bênçãos para o livro real da Princesa Eloá!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-5 rounded-2xl border border-[#E7D5B5] shadow-sm relative overflow-hidden text-left"
                      >
                        {/* Wax Seal aesthetic circle ornament */}
                        <span className="absolute top-4 right-4 text-[#A04BC7] opacity-25">
                          <Heart className="h-4 w-4 fill-current" />
                        </span>

                        <div className="flex items-center space-x-2">
                          <h4 className="font-cinzel text-[#5A2D82] font-semibold text-xs sm:text-sm tracking-wide uppercase">
                            {msg.name}
                          </h4>
                          <span className="text-gray-300 text-xs">•</span>
                          <span className="text-[10px] text-gray-400 font-sans">{msg.date}</span>
                        </div>

                        <p className="font-cormorant text-gray-700 text-md sm:text-lg italic leading-relaxed mt-2 pl-2 border-l border-[#C8A45A]">
                          &ldquo;{msg.text}&rdquo;
                        </p>
                      </motion.div>
                    ))
                  )}
                </div>

              </div>

            </div>
          </section>


          {/* --- SEÇÃO CONTATO WHATSAPP --- */}
          <section className="py-16 px-4 bg-[#F7F3EE] relative">
            <div className="max-w-xl mx-auto space-y-6 text-center">
              <h3 className="font-cinzel text-[#5A2D82] text-xl tracking-wider uppercase">DÚVIDAS OU INFORMAÇÕES?</h3>
              <p className="font-cormorant text-gray-600">
                Caso necessite falar com a assessoria da cerimônia ou solicitar links alternativos:
              </p>

              {/* Button "Falar com a Organização" prepared for future links */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
                <a
                  id="whatsapp-organizacao-btn"
                  href="https://wa.me/5511951605888?text=Ol%C3%A1%21+Gostaria+de+informa%C3%A7%C3%B5es+sobre+o+anivers%C3%A1rio+da+Princesa+Elo%C3%A1."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-8 py-3.5 bg-[#25D366] hover:bg-emerald-600 text-white rounded-full font-cinzel text-xs uppercase tracking-widest shadow-md transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Falar com a Organização</span>
                </a>
              </div>
            </div>
          </section>


          {/* --- RODAPÉ PREMIUM --- */}
          <footer className="py-16 px-4 bg-[#5A2D82] text-[#F7F3EE] text-center relative border-t-2 border-[#C8A45A]">
            {/* Elegant Royal Damask Background Accent */}
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#F7F3EE_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>

            <div className="max-w-2xl mx-auto space-y-8 relative z-20">
              
              {/* Gold Crown Silhouette footer vector */}
              <div className="flex justify-center">
                <div className="relative h-16 w-16 rounded-full shadow-lg border border-[#C8A45A] overflow-hidden bg-[#5A2D82]">
                  <Image
                    src="/images/royal_monogram_e.png"
                    alt="Monograma Imperial Eloá E"
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-cinzel text-[#D4AF37] tracking-widest text-lg font-semibold uppercase">
                  Reino Encantado de Eloá
                </h4>
                <div className="w-12 h-[1px] bg-[#C8A45A] mx-auto"></div>
                
                <p className="font-cormorant text-md sm:text-xl italic leading-relaxed max-w-lg mx-auto text-pink-100">
                  {"\"Sua presença tornará este dia ainda mais especial. Esperamos você para viver momentos mágicos ao lado da Princesa Eloá.\""}
                </p>
              </div>

              <div className="space-y-1 pt-4 text-[10px] font-sans tracking-widest text-[#E7D5B5]/60 uppercase">
                <p>13 de Junho de 2026</p>
                <p>© Todos os Direitos ao Trono de Eloá reservados.</p>
              </div>

            </div>
          </footer>

        </motion.main>
      )}

      {/* Bulletproof HTML5 Ambient Audio preloader and controller */}
      <audio
        ref={audioRef}
        src={PLAYLIST[currentTrackIndex].src}
        loop
        preload="auto"
        playsInline
        id="ambient-royal-audio"
      />

    </div>
  );
}

// ==========================================
// BACKGROUND INTERATIVO DE LUXO E PARALLAX
// ==========================================

import { useMemo } from 'react';

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  speed: number;
  parallaxX: number;
  parallaxY: number;
  opacity: number;
  delay: number;
}

const PARTICLES_DATA: Particle[] = [
  { id: 1, left: 12, top: 15, size: 2.2, speed: 0.5, parallaxX: -15, parallaxY: 10, opacity: 0.4, delay: 0.2 },
  { id: 2, left: 88, top: 22, size: 3.5, speed: 0.8, parallaxX: 20, parallaxY: -25, opacity: 0.6, delay: 1.1 },
  { id: 3, left: 24, top: 72, size: 1.8, speed: 0.3, parallaxX: -10, parallaxY: 15, opacity: 0.7, delay: 2.0 },
  { id: 4, left: 76, top: 85, size: 2.8, speed: 0.6, parallaxX: 25, parallaxY: 30, opacity: 0.5, delay: 0.8 },
  { id: 5, left: 5, top: 45, size: 2.0, speed: 0.4, parallaxX: -18, parallaxY: -12, opacity: 0.3, delay: 1.5 },
  { id: 6, left: 95, top: 60, size: 3.0, speed: 0.7, parallaxX: 30, parallaxY: -18, opacity: 0.8, delay: 0.3 },
  { id: 7, left: 45, top: 8, size: 1.5, speed: 0.2, parallaxX: 5, parallaxY: -5, opacity: 0.5, delay: 2.4 },
  { id: 8, left: 55, top: 92, size: 2.5, speed: 0.5, parallaxX: -5, parallaxY: 10, opacity: 0.4, delay: 3.1 },
  { id: 9, left: 33, top: 35, size: 2.7, speed: 0.6, parallaxX: -12, parallaxY: -8, opacity: 0.6, delay: 1.7 },
  { id: 10, left: 66, top: 55, size: 1.9, speed: 0.4, parallaxX: 14, parallaxY: 12, opacity: 0.5, delay: 0.9 },
  { id: 11, left: 18, top: 88, size: 3.2, speed: 0.7, parallaxX: -22, parallaxY: 28, opacity: 0.7, delay: 2.8 },
  { id: 12, left: 82, top: 12, size: 2.1, speed: 0.5, parallaxX: 18, parallaxY: -15, opacity: 0.4, delay: 0.5 },
  { id: 13, left: 40, top: 65, size: 2.3, speed: 0.4, parallaxX: -8, parallaxY: 18, opacity: 0.5, delay: 1.2 },
  { id: 14, left: 60, top: 28, size: 3.1, speed: 0.6, parallaxX: 12, parallaxY: -22, opacity: 0.6, delay: 3.5 },
  { id: 15, left: 8, top: 90, size: 1.7, speed: 0.3, parallaxX: -30, parallaxY: 25, opacity: 0.5, delay: 0.1 },
  { id: 16, left: 92, top: 82, size: 2.4, speed: 0.5, parallaxX: 28, parallaxY: 22, opacity: 0.4, delay: 1.9 },
  { id: 17, left: 28, top: 18, size: 2.9, speed: 0.7, parallaxX: -14, parallaxY: -14, opacity: 0.7, delay: 2.3 },
  { id: 18, left: 72, top: 78, size: 1.6, speed: 0.3, parallaxX: 16, parallaxY: 16, opacity: 0.8, delay: 0.7 },
  { id: 19, left: 50, top: 50, size: 3.3, speed: 0.8, parallaxX: 2, parallaxY: 2, opacity: 0.6, delay: 3.0 },
  { id: 20, left: 35, top: 82, size: 2.0, speed: 0.5, parallaxX: -10, parallaxY: 20, opacity: 0.5, delay: 1.4 },
  { id: 21, left: 65, top: 18, size: 2.6, speed: 0.6, parallaxX: 10, parallaxY: -20, opacity: 0.4, delay: 0.6 },
  { id: 22, left: 14, top: 58, size: 1.8, speed: 0.4, parallaxX: -16, parallaxY: 8, opacity: 0.5, delay: 2.1 },
  { id: 23, left: 86, top: 48, size: 3.0, speed: 0.7, parallaxX: 24, parallaxY: -4, opacity: 0.7, delay: 3.3 },
  { id: 24, left: 48, top: 38, size: 2.2, speed: 0.5, parallaxX: -4, parallaxY: -10, opacity: 0.6, delay: 1.0 },
  { id: 25, left: 52, top: 62, size: 1.5, speed: 0.3, parallaxX: 4, parallaxY: 10, opacity: 0.5, delay: 2.6 }
];

const ORCHIDS_DATA = [
  { id: 1, left: '5%', top: '10%', size: 90, rotation: -15, parallaxX: -20, parallaxY: -15, type: 'orchid1' as const },
  { id: 2, left: '85%', top: '25%', size: 100, rotation: 35, parallaxX: 25, parallaxY: -20, type: 'orchid2' as const },
  { id: 3, left: '2%', top: '65%', size: 70, rotation: 120, parallaxX: -15, parallaxY: 15, type: 'petal1' as const },
  { id: 4, left: '90%', top: '75%', size: 80, rotation: 45, parallaxX: 30, parallaxY: 25, type: 'orchid1' as const },
  { id: 5, left: '12%', top: '45%', size: 50, rotation: -40, parallaxX: -10, parallaxY: -25, type: 'petal2' as const },
  { id: 6, left: '78%', top: '55%', size: 60, rotation: 75, parallaxX: 20, parallaxY: 10, type: 'petal1' as const },
];

function InteractiveEnchantedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const lastMoveTime = useRef(0);

  useEffect(() => {
    lastMoveTime.current = Date.now();
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      targetPos.current = { x, y };
      lastMoveTime.current = Date.now();
    };

    window.addEventListener('mousemove', handleMouseMove);

    const updateAnimation = () => {
      const now = Date.now();
      const elapsed = now - lastMoveTime.current;

      // Auto-drift when idle
      if (elapsed > 2000) {
        const time = now * 0.001;
        targetPos.current.x = Math.sin(time * 0.4) * 0.25;
        targetPos.current.y = Math.cos(time * 0.3) * 0.25;
      }

      // Smooth interpolation
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;
      currentPos.current.x += dx * 0.06;
      currentPos.current.y += dy * 0.06;

      // Direct DOM manipulation via refs for ultra high-performance
      if (containerRef.current) {
        const particlesEl = containerRef.current.querySelectorAll('.bg-particle');
        const orchidsEl = containerRef.current.querySelectorAll('.bg-orchid');

        particlesEl.forEach((el) => {
          const idxStr = el.getAttribute('data-index');
          if (idxStr !== null) {
            const idx = parseInt(idxStr);
            const p = PARTICLES_DATA[idx];
            if (p) {
              const tx = currentPos.current.x * p.parallaxX;
              const ty = currentPos.current.y * p.parallaxY;
              (el as HTMLElement).style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
            }
          }
        });

        orchidsEl.forEach((el) => {
          const idxStr = el.getAttribute('data-index');
          if (idxStr !== null) {
            const idx = parseInt(idxStr);
            const o = ORCHIDS_DATA[idx];
            if (o) {
              const tx = currentPos.current.x * o.parallaxX;
              const ty = currentPos.current.y * o.parallaxY;
              const rot = o.rotation + (currentPos.current.x * 5);
              (el as HTMLElement).style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg)`;
            }
          }
        });
      }

      animationFrameId = requestAnimationFrame(updateAnimation);
    };

    animationFrameId = requestAnimationFrame(updateAnimation);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Background premium glow layers */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-50/10 via-amber-100/5 to-transparent pointer-events-none"></div>

      {/* Dynamic Golden Particles */}
      {PARTICLES_DATA.map((p, i) => (
        <div
          key={p.id}
          className="bg-particle absolute rounded-full bg-[#D4AF37] mix-blend-color-dodge animate-pulse pointer-events-none"
          data-index={i}
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            boxShadow: '0 0 6px #F5E3B5',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform'
          }}
        />
      ))}

      {/* Dynamic Orchids & Petals Parallax */}
      {ORCHIDS_DATA.map((o, i) => (
        <div
          key={o.id}
          className="bg-orchid absolute opacity-40 hover:opacity-80 transition-opacity duration-500 pointer-events-none"
          data-index={i}
          style={{
            left: o.left,
            top: o.top,
            width: `${o.size}px`,
            height: `${o.size}px`,
            transform: `translate3d(0, 0, 0) rotate(${o.rotation}deg)`,
            willChange: 'transform'
          }}
        >
          {o.type === 'orchid1' && <OrchidSVG1 />}
          {o.type === 'orchid2' && <OrchidSVG2 />}
          {o.type === 'petal1' && <PetalSVG1 />}
          {o.type === 'petal2' && (
            <div className="w-full h-full rotate-45 scale-90">
              <PetalSVG1 />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Vector drawings for Premium Botanicals

const OrchidSVG1 = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_4px_10px_rgba(160,75,199,0.25)]">
    <path d="M50 15 C40 30 30 40 50 85 C70 40 60 30 50 15 Z" fill="url(#orchidGrad_1)" opacity="0.85" />
    <path d="M15 50 C30 40 40 30 85 50 C40 70 30 60 15 50 Z" fill="url(#orchidGrad_1)" opacity="0.85" />
    <path d="M50 85 C40 70 20 60 40 40 C60 60 60 70 50 85 Z" fill="url(#orchidGrad_2)" opacity="0.9" />
    <circle cx="50" cy="50" r="10" fill="url(#goldGrad_bg)" />
    <circle cx="50" cy="50" r="6" fill="#5A2D82" />
    <circle cx="48" cy="46" r="2" fill="#fff" opacity="0.8" />
    <circle cx="52" cy="52" r="1.5" fill="#fff" opacity="0.8" />
    <defs>
      <linearGradient id="orchidGrad_1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A04BC7" strokeWidth="0" />
        <stop offset="100%" stopColor="#5A2D82" strokeWidth="0" />
      </linearGradient>
      <linearGradient id="orchidGrad_2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#C8A45A" strokeWidth="0" />
        <stop offset="100%" stopColor="#A04BC7" strokeWidth="0" />
      </linearGradient>
      <linearGradient id="goldGrad_bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#D4AF37" strokeWidth="0" />
        <stop offset="100%" stopColor="#C8A45A" strokeWidth="0" />
      </linearGradient>
    </defs>
  </svg>
);

const OrchidSVG2 = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_4px_8px_rgba(212,175,55,0.2)]">
    <path d="M50 50 C25 25 10 40 50 85 C90 40 75 25 50 50 Z" fill="url(#orchidGrad_1)" opacity="0.8" />
    <path d="M50 50 C40 35 60 35 50 15 C45 35 55 35 50 50 Z" fill="url(#orchidGrad_2)" opacity="0.9" />
    <circle cx="50" cy="48" r="8" fill="url(#goldGrad_bg)" />
    <path d="M46 48 Q50 38 54 48" stroke="#5A2D82" strokeWidth="1" fill="none" />
  </svg>
);

const PetalSVG1 = () => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M10 25 C15 10 35 15 40 25 C30 40 20 35 10 25 Z" fill="url(#petalGrad_bg)" opacity="0.75" />
    <path d="M15 22 C18 13 32 17 35 23" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="1 1" opacity="0.6" />
    <defs>
      <linearGradient id="petalGrad_bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EFE7DB" strokeWidth="0" />
        <stop offset="100%" stopColor="#A04BC7" strokeWidth="0" />
      </linearGradient>
    </defs>
  </svg>
);
