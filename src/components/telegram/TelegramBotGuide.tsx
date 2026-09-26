import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import {
  Bot,
  Copy,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  Terminal,
  Share2,
  Download,
  Image as ImageIcon,
  Sparkles,
  Info,
} from 'lucide-react';
import { triggerTelegramHaptic, shareToTelegram } from '../../utils/telegramSdk';
import { downloadSvgAsPng, downloadRemoteImage } from '../../utils/imageDownloader';

interface ImageAsset {
  id: string;
  title: string;
  dimensions: string;
  useCase: string;
  url: string;
  type: 'svg' | 'photo';
  width: number;
  height: number;
}

export const TelegramBotGuide: React.FC = () => {
  const { currentBusiness } = useRetail();
  const [copiedIndex, setCopiedIndex] = useState<number | string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeAssetTab, setActiveAssetTab] = useState<'botfather' | 'products'>('botfather');

  // Convert private development domain (ais-dev-) to public domain (ais-pre-) so Telegram can open it without Google 403
  const getPublicBaseUrl = () => {
    if (typeof window === 'undefined') return 'https://your-domain.com';
    let origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    return origin;
  };

  const baseUrl = getPublicBaseUrl();
  const miniAppUrl = `${baseUrl}/?view=telegram`;

  const copyText = (text: string, idx: number | string) => {
    triggerTelegramHaptic('success');
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleDownload = async (asset: ImageAsset) => {
    triggerTelegramHaptic('medium');
    setDownloadingId(asset.id);
    try {
      if (asset.type === 'svg') {
        await downloadSvgAsPng(asset.url, `${asset.id}.png`, asset.width, asset.height);
      } else {
        await downloadRemoteImage(asset.url, `${asset.id}.jpg`);
      }
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  // BotFather required images (640x360 16:9 for /newapp and /setappphoto, 500x500 for /setuserpic)
  const botFatherAssets: ImageAsset[] = [
    {
      id: 'botfather_miniapp_banner_640x360',
      title: 'Official Boutique Mini App Banner (Recommended)',
      dimensions: '640 × 360 px (Exact 16:9)',
      useCase: 'Required by BotFather for /newapp and /setappphoto',
      url: `${baseUrl}/assets/telegram-botfather-banner-640x360.svg`,
      type: 'svg',
      width: 640,
      height: 360,
    },
    {
      id: 'botfather_bot_avatar_500x500',
      title: 'Boutique Gold Monogram Avatar',
      dimensions: '500 × 500 px (1:1 Square)',
      useCase: 'For BotFather /setuserpic (Bot profile picture)',
      url: `${baseUrl}/assets/telegram-bot-avatar-500x500.svg`,
      type: 'svg',
      width: 500,
      height: 500,
    },
    {
      id: 'boutique_storefront_640x360',
      title: 'Luxury Storefront Photo Banner',
      dimensions: '640 × 360 px (16:9)',
      useCase: 'Alternative photo for BotFather /setappphoto',
      url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=640&h=360&fit=crop&q=80',
      type: 'photo',
      width: 640,
      height: 360,
    },
    {
      id: 'designer_collection_640x360',
      title: 'Haute Couture Apparel Photo Banner',
      dimensions: '640 × 360 px (16:9)',
      useCase: 'Alternative photo for BotFather /setappphoto',
      url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=640&h=360&fit=crop&q=80',
      type: 'photo',
      width: 640,
      height: 360,
    },
  ];

  // Sample Product Images for inventory catalog
  const sampleProductImages: ImageAsset[] = [
    {
      id: 'emerald_silk_dress',
      title: 'Emerald Silk Evening Gown',
      dimensions: '800 × 1000 px',
      useCase: 'Product catalog photo (Shein/Import dress)',
      url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
      type: 'photo',
      width: 800,
      height: 1000,
    },
    {
      id: 'luxury_leather_handbag',
      title: 'Italian Caramel Leather Handbag',
      dimensions: '800 × 800 px',
      useCase: 'Product catalog photo (Accessories)',
      url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
      type: 'photo',
      width: 800,
      height: 800,
    },
    {
      id: 'designer_heels',
      title: 'Stiletto Designer Heels',
      dimensions: '800 × 800 px',
      useCase: 'Product catalog photo (Footwear)',
      url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80',
      type: 'photo',
      width: 800,
      height: 800,
    },
    {
      id: 'chic_suit_set',
      title: 'Tailored Two-Piece Chic Suit',
      dimensions: '800 × 1000 px',
      useCase: 'Product catalog photo (Pre-Order Set)',
      url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
      type: 'photo',
      width: 800,
      height: 1000,
    },
  ];

  const steps = [
    {
      title: '1. Open @BotFather on Telegram',
      desc: 'Start a chat with BotFather (Telegram official bot creator) to register or configure your bot.',
      command: '/newbot',
    },
    {
      title: '2. Create a Mini App for Your Bot',
      desc: 'Send the command to link this web application as a Telegram Mini App.',
      command: '/newapp',
      imageTip: 'BotFather will ask: "Please send a photo for your Web App (640x360 px)". Use the 640x360 image downloaded below!',
    },
    {
      title: '3. Set the WebApp URL',
      desc: 'When BotFather asks for the WebApp URL, paste the live URL below:',
      command: miniAppUrl,
    },
    {
      title: '4. Set the Menu Button in Chat',
      desc: 'Make the Mini App launchable from the bottom menu of your Telegram bot chat.',
      command: '/setmenubutton',
    },
    {
      title: '5. Set Bot Profile Picture (Optional)',
      desc: 'Upload the 1:1 square avatar for your bot profile in Telegram.',
      command: '/setuserpic',
    },
  ];

  return (
    <div className="space-y-4 pb-20 text-xs">
      {/* Hero Card */}
      <div className="bg-linear-to-br from-[#24A1DE] to-[#0088CC] text-white p-5 rounded-3xl shadow-md space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base">Telegram Bot Connection</h3>
            <p className="text-white/80 text-[11px]">
              Deploy this Mini App to your Telegram Bot @{currentBusiness.telegramUsername}
            </p>
          </div>
        </div>

        <p className="text-white/90 text-xs leading-relaxed">
          Telegram Mini Apps allow shop staff and customers to add products, adjust stock, and create orders directly inside the Telegram chat window with native speeds and haptics.
        </p>

        <div className="pt-1 flex flex-wrap items-center gap-2">
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-white text-[#0088CC] rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-stone-100 transition-colors"
          >
            <span>Open @BotFather</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() => shareToTelegram(`Open ${currentBusiness.name} Mini App:`, miniAppUrl)}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </button>
        </div>
      </div>

      {/* Mini App URL Box */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#24A1DE]" />
            <span>Your Telegram Mini App URL</span>
          </span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
            Live & Ready
          </span>
        </div>

        <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200">
          <code className="text-[11px] font-mono text-stone-800 flex-1 truncate font-semibold">
            {miniAppUrl}
          </code>
          <button
            type="button"
            onClick={() => copyText(miniAppUrl, 'app_url')}
            className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 transition-colors shrink-0 cursor-pointer"
            title="Copy URL"
          >
            {copiedIndex === 'app_url' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* 403 Error Fix Callout */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-[11px] text-sky-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-sky-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Got "Google 403. That's an error" in Telegram?</span>
          </div>
          <p className="leading-relaxed text-sky-800">
            This happens if you pasted the private development link (<code className="font-mono bg-sky-100 px-1 py-0.5 rounded text-sky-950">ais-dev-</code>). Telegram requires the public shared link (<code className="font-mono bg-sky-100 px-1 py-0.5 rounded text-sky-950 font-bold">ais-pre-</code>).
          </p>
          <p className="leading-relaxed font-medium text-sky-900 pt-0.5">
            To fix: Run <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-sky-300">/setmenubutton</code> in @BotFather, select your bot, and paste the URL above!
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION: IMAGES TO UPLOAD (BOTFATHER 640x360 & AVATARS) */}
      {/* ============================================================ */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                <span>Images to Upload</span>
                <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                  640×360 px Ready
                </span>
              </h4>
              <p className="text-[11px] text-stone-600">
                BotFather requires exact 640×360 px image for WebApps & 1:1 for Bot Avatar
              </p>
            </div>
          </div>

          {/* Tab selector */}
          <div className="flex bg-white rounded-lg p-0.5 border border-stone-200 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveAssetTab('botfather')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                activeAssetTab === 'botfather'
                  ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              BotFather (640x360)
            </button>
            <button
              type="button"
              onClick={() => setActiveAssetTab('products')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                activeAssetTab === 'products'
                  ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Catalog Products
            </button>
          </div>
        </div>

        {/* Info notice about BotFather prompt */}
        <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200 text-[11px] text-stone-700">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {activeAssetTab === 'botfather' ? (
              <span>
                When running <strong>/newapp</strong> or <strong>/setappphoto</strong>, BotFather explicitly asks:
                <br />
                <code className="text-stone-900 bg-amber-100/60 px-1 py-0.5 rounded font-mono text-[10px]">
                  "Please send a photo for your Web App (640x360 px, or an animated sticker / gif)."
                </code>
                <br />
                Click <strong>"Download PNG"</strong> below and simply send that downloaded file to BotFather!
              </span>
            ) : (
              <span>
                These high-resolution boutique product photos can be copied or downloaded to upload into your
                <strong> In-Store Inventory</strong> or <strong>Customer Orders</strong>.
              </span>
            )}
          </p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(activeAssetTab === 'botfather' ? botFatherAssets : sampleProductImages).map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs flex flex-col justify-between"
            >
              {/* Image Preview Container */}
              <div className="relative bg-stone-900 aspect-16/9 overflow-hidden flex items-center justify-center group">
                <img
                  src={asset.url}
                  alt={asset.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-xs text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-md border border-stone-700/50">
                  {asset.dimensions}
                </div>
              </div>

              {/* Card Meta & Actions */}
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-stone-900 text-xs leading-snug">{asset.title}</h5>
                  <p className="text-[10px] text-stone-500 mt-0.5">{asset.useCase}</p>
                </div>

                <div className="pt-2 flex items-center gap-1.5 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => handleDownload(asset)}
                    disabled={downloadingId === asset.id}
                    className="flex-1 py-1.5 px-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3 h-3 text-amber-400" />
                    <span>{downloadingId === asset.id ? 'Downloading...' : 'Download Image'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => copyText(asset.url, asset.id)}
                    className="py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer border border-stone-200 shrink-0"
                    title="Copy Image URL"
                  >
                    {copiedIndex === asset.id ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold text-[10px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[10px]">Copy Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors shrink-0"
                    title="Open full image in new tab"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step by Step Configuration */}
      <div className="space-y-2.5">
        <h4 className="font-bold text-stone-900 text-xs px-1">
          Quick Setup Steps with @BotFather
        </h4>

        {steps.map((st, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-2xs space-y-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <h5 className="font-bold text-stone-900">{st.title}</h5>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{st.desc}</p>
                {st.imageTip && (
                  <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{st.imageTip}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-stone-900 text-stone-200 rounded-xl font-mono text-[11px]">
              <div className="flex items-center gap-2 min-w-0">
                <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{st.command}</span>
              </div>
              <button
                type="button"
                onClick={() => copyText(st.command, idx)}
                className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white transition-colors shrink-0 cursor-pointer"
                title="Copy command"
              >
                {copiedIndex === idx ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Security & Features Summary */}
      <div className="bg-stone-100 rounded-2xl p-4 border border-stone-200 space-y-2 text-stone-600 text-[11px]">
        <div className="flex items-center gap-2 font-bold text-stone-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Telegram Mini App Features Included</span>
        </div>
        <ul className="space-y-1 pl-5 list-disc">
          <li>Direct Order Creation with live stock verification and receipt generation.</li>
          <li>Instant Inventory creation with photos, variants, and stock counts.</li>
          <li>Stock level quick adjustments (+ / -) directly from Telegram.</li>
          <li>Auto-detection of Telegram username and profile info via WebApp SDK.</li>
          <li>Haptic feedback triggers on order submission and stock updates.</li>
        </ul>
      </div>
    </div>
  );
};

