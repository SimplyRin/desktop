# GitPeach Desktop Snap パッケージング

このディレクトリには、GitPeach Desktop の Snap パッケージング設定が含まれています。

## ビルド手順

### 前提条件
- Snapcraft がインストールされていること
- .deb ファイルがプロジェクトのルートディレクトリにあること

### 手順
1. .deb ファイルをプロジェクトのルートフォルダから `snap/` フォルダ内にコピーまたは移動します。
   ```bash
   cp ../gitpeach-desktop_*.deb .
   ```

2. Snap パッケージをビルドします。
   ```bash
   snapcraft pack
   ```

   または、デバッグモードでビルドする場合：
   ```bash
   snapcraft --destructive-mode
   ```

3. ビルドが完了すると、`.snap` ファイルが生成されます。

### 注意事項
- .deb ファイルは `snapcraft.yaml` の `source` で指定された `snap/` ディレクトリ内に配置する必要があります。
- ビルドプロセスでは、parts/stage/prime の各段階でファイルが処理されます。
- 問題が発生した場合は、`snapcraft clean` でビルドキャッシュをクリアしてください。

## ビルド段階の詳細

`snapcraft pack` を実行すると、以下の段階で自動的にフォルダが作成され、分解・パッケージングが行われます：

### 1. parts
- 各 `parts`（例: `gitpeach-desktop`）のソースが処理されます。
- `source: ./` から .deb ファイルをコピーし、`override-build` で `dpkg -x` を実行して展開。
- 展開されたファイルが `parts/gitpeach-desktop/install/` に格納されます。

### 2. stage
- すべてのパーツの成果物が統合され、`stage/` フォルダにコピーされます。
- `stage-packages` で指定された依存ライブラリが追加されます。
- 依存関係の解決が行われます。

### 3. prime
- `stage/` から不要なファイルを除去し、最終的なパッケージ内容が `prime/` に準備されます。
- このフォルダの内容が `.snap` ファイルにパッケージングされます。

詳細は [Snapcraft ドキュメント](https://snapcraft.io/docs) を参照してください。
