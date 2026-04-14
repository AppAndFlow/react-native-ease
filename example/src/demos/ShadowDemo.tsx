import { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function ShadowDemo() {
  const [active, setActive] = useState(false);
  return (
    <Section title="Shadow / Elevation">
      <View style={styles.surface}>
        <EaseView
          animate={
            active
              ? {
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 12,
                }
              : {
                  shadowOpacity: 0,
                  shadowRadius: 0,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 0,
                }
          }
          transition={{
            shadow: { type: 'spring', damping: 15, stiffness: 120 },
          }}
          style={styles.box}
        >
          <Text style={styles.text}>
            {active
              ? Platform.OS === 'android'
                ? 'Elevated'
                : 'Shadow'
              : 'Flat'}
          </Text>
        </EaseView>
      </View>
      <Button
        label={active ? 'Remove' : 'Add Shadow'}
        onPress={() => setActive((v) => !v)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: '#e8eaf0',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  box: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#333',
    fontSize: 13,
    fontWeight: '700',
  },
});
